"""Database layer: asyncpg pool, schema bootstrap, IP hashing, queries.

Serverless-friendly: the pool is created lazily once per warm instance and
recreated if it dies. Schema is applied idempotently on first use.
"""

import hashlib
import logging
import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import asyncpg
from fastapi import Request

log = logging.getLogger("fortfolio.analytics.db")

DATABASE_URL = os.environ.get("DATABASE_URL", "")
IP_HASH_SALT = os.environ.get("IP_HASH_SALT") or "fortfolio-dev-salt"

if IP_HASH_SALT == "fortfolio-dev-salt":
    log.warning("IP_HASH_SALT not set — using dev fallback salt")

_pool: asyncpg.Pool | None = None
_pool_failed = False
_schema_ready = False

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    game TEXT,
    platform TEXT,
    path TEXT,
    visitor_hash TEXT NOT NULL,
    day DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS events_pv_dedupe
    ON events (visitor_hash, type, day) WHERE type = 'page_view';
CREATE INDEX IF NOT EXISTS events_type_game_idx ON events (type, game);

CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    game TEXT NOT NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    ip_hash TEXT NOT NULL,
    day DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (game, ip_hash, day)
);
CREATE INDEX IF NOT EXISTS ratings_game_idx ON ratings (game);
"""


def hash_ip(request: Request) -> str:
    """SHA-256(salt + client IP). Raw IPs are never stored."""
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else ""
    if not ip and request.client:
        ip = request.client.host
    if not ip:
        ip = "unknown"
    return hashlib.sha256((IP_HASH_SALT + ip).encode("utf-8")).hexdigest()


# Query params asyncpg doesn't understand — sslmode is translated to the `ssl`
# kwarg, channel_binding is a libpq-ism Neon adds that asyncpg can't parse.
_STRIP_PARAMS = {"sslmode", "channel_binding"}


def _split_sslmode(dsn: str) -> tuple[str, str | None]:
    """Pull sslmode out of the DSN query and return (clean_dsn, sslmode)."""
    parts = urlsplit(dsn)
    query = dict(parse_qsl(parts.query))
    sslmode = query.pop("sslmode", None)
    for key in _STRIP_PARAMS:
        query.pop(key, None)
    clean = urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )
    return clean, sslmode


_SSLMODE_MAP = {
    "disable": None,
    "allow": "allow",
    "prefer": "prefer",
    "require": "require",
    "verify-ca": "verify-ca",
    "verify-full": "verify-full",
}


async def get_pool() -> asyncpg.Pool:
    """Lazy singleton pool; raises if DATABASE_URL is unset."""
    global _pool, _pool_failed
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    if _pool is not None:
        return _pool
    if _pool_failed:
        raise RuntimeError("database pool previously failed to connect")
    try:
        dsn, sslmode = _split_sslmode(DATABASE_URL)
        if sslmode is not None:
            ssl = _SSLMODE_MAP.get(sslmode)
        elif "localhost" in dsn or "127.0.0.1" in dsn:
            ssl = None
        else:
            ssl = "require"
        _pool = await asyncpg.create_pool(dsn, min_size=1, max_size=3, ssl=ssl)
    except Exception:
        _pool_failed = True
        log.exception("failed to create asyncpg pool")
        raise
    return _pool


async def ensure_schema() -> None:
    global _schema_ready
    if _schema_ready:
        return
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(SCHEMA_SQL)
    _schema_ready = True


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def insert_event(
    conn_type: str,
    game: str | None,
    platform: str | None,
    path: str | None,
    visitor_hash: str,
) -> None:
    """Insert an event row. page_view dedupes per visitor+UTC day."""
    pool = await get_pool()
    await ensure_schema()
    async with pool.acquire() as conn:
        if conn_type == "page_view":
            await conn.execute(
                """
                INSERT INTO events (type, game, platform, path, visitor_hash)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (visitor_hash, type, day)
                WHERE type = 'page_view'
                DO NOTHING
                """,
                conn_type, game, platform, path, visitor_hash,
            )
        else:
            await conn.execute(
                """
                INSERT INTO events (type, game, platform, path, visitor_hash)
                VALUES ($1, $2, $3, $4, $5)
                """,
                conn_type, game, platform, path, visitor_hash,
            )


async def upsert_rating(
    game: str, score: int, comment: str | None, ip_hash: str
) -> None:
    """One rating per game per IP hash per UTC day; same-day re-rate updates."""
    pool = await get_pool()
    await ensure_schema()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ratings (game, score, comment, ip_hash)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (game, ip_hash, day)
            DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment
            """,
            game, score, comment, ip_hash,
        )


async def get_stats(game: str) -> dict:
    pool = await get_pool()
    await ensure_schema()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                (SELECT COUNT(*) FROM events WHERE type = 'page_view') AS views,
                (SELECT COUNT(*) FROM events
                  WHERE type = 'download_click' AND game = $1 AND platform = 'android') AS dl_android,
                (SELECT COUNT(*) FROM events
                  WHERE type = 'download_click' AND game = $1 AND platform = 'pc') AS dl_pc,
                (SELECT COUNT(*) FROM ratings WHERE game = $1) AS rating_count,
                (SELECT AVG(score) FROM ratings WHERE game = $1) AS avg_rating
            """,
            game,
        )
    avg = row["avg_rating"]
    return {
        "views": row["views"],
        "downloads": {"android": row["dl_android"], "pc": row["dl_pc"]},
        "avg_rating": round(float(avg), 2) if avg is not None else None,
        "rating_count": row["rating_count"],
    }
