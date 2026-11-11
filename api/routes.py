"""Analytics endpoints: track, rate, stats."""

import logging

from fastapi import APIRouter, HTTPException, Request, Response, status

from . import db
from .schemas import RateIn, StatsOut, TrackIn

log = logging.getLogger("fortfolio.analytics.routes")

router = APIRouter()


@router.post("/track", status_code=status.HTTP_204_NO_CONTENT)
async def track(payload: TrackIn, request: Request) -> Response:
    """Fire-and-forget event ingest. Always 204 — analytics never breaks UX."""
    try:
        await db.insert_event(
            payload.event,
            payload.game,
            payload.platform,
            payload.path,
            db.hash_ip(request),
        )
    except Exception:
        log.exception("track insert failed")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/rate")
async def rate(payload: RateIn, request: Request) -> dict:
    """Submit a 1-5 star rating. One per game per IP hash per UTC day (upsert)."""
    if payload.honeypot:
        # Silent reject — pretend success so bots don't retry differently.
        return {"ok": True}
    try:
        await db.upsert_rating(
            payload.game, payload.score, payload.comment, db.hash_ip(request)
        )
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ratings are not configured",
        )
    except Exception:
        log.exception("rating upsert failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="rating unavailable",
        )
    try:
        stats = await db.get_stats(payload.game)
        return {
            "ok": True,
            "avg_rating": stats["avg_rating"],
            "rating_count": stats["rating_count"],
        }
    except Exception:
        # Rating was saved — don't fail the request over a stats read.
        return {"ok": True}


@router.get("/stats", response_model=StatsOut)
async def stats(response: Response, game: str = "raftytrip") -> StatsOut:
    try:
        result = await db.get_stats(game)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="analytics are not configured",
        )
    except Exception:
        log.exception("stats query failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="stats unavailable",
        )
    response.headers["Cache-Control"] = "public, max-age=60"
    return StatsOut(**result)
