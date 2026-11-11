"""Pydantic request/response schemas for the analytics API."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class TrackIn(BaseModel):
    event: Literal["page_view", "download_click"]
    game: Optional[str] = Field(default=None, max_length=50)
    platform: Optional[str] = Field(default=None, max_length=20)
    path: Optional[str] = Field(default=None, max_length=200)


class RateIn(BaseModel):
    game: str = Field(default="raftytrip", max_length=50)
    score: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=500)
    honeypot: Optional[str] = None


class DownloadsOut(BaseModel):
    android: int
    pc: int


class StatsOut(BaseModel):
    views: int
    downloads: DownloadsOut
    avg_rating: Optional[float] = None
    rating_count: int
