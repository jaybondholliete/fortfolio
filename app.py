"""Fortfolio analytics API — FastAPI entrypoint for Vercel serverless.

Zero-config: Vercel detects `fastapi` in requirements.txt + this `app.py`
entrypoint and routes all requests here. The static site stays on GitHub Pages.
"""

import logging
import os
import sys
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import db
from api.routes import router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fortfolio.analytics")

DEFAULT_ORIGINS = [
    "https://jaybondholliete.github.io",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def _allowed_origins() -> list[str]:
    extra = os.environ.get("ALLOWED_ORIGINS", "")
    origins = list(DEFAULT_ORIGINS)
    for o in extra.split(","):
        o = o.strip()
        if o and o not in origins:
            origins.append(o)
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await db.ensure_schema()
        log.info("analytics schema ready")
    except Exception:
        log.warning("database unavailable at startup — endpoints will degrade", exc_info=True)
    yield
    await db.close_pool()


def create_app() -> FastAPI:
    app = FastAPI(title="Fortfolio Analytics", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins(),
        allow_origin_regex=r"https://[a-zA-Z0-9.-]*\.vercel\.app",
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        allow_credentials=True,
        max_age=7200,
    )

    @app.get("/api/health")
    async def health() -> dict:
        return {"ok": True}

    app.include_router(router, prefix="/api")
    return app


app = create_app()
