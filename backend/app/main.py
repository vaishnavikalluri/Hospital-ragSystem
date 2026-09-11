"""
FastAPI application entry point.
Concept 35 — Backend API for the RAG Service
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import get_settings
from backend.app.routers import admin, auth, chat, documents
from backend.monitoring.logger import configure_logging, get_logger

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(
        "app_startup",
        env=settings.app_env,
        model=settings.openai_chat_model,
        embedding_model=settings.openai_embedding_model,
    )

    # Verify staff file exists on startup
    from backend.auth.hospital_auth import HospitalAuth
    auth = HospitalAuth(settings)
    if auth.staff_file_exists():
        logger.info("staff_file_found", path=str(settings.staff_csv_path))
    else:
        logger.warning(
            "staff_file_missing_at_startup",
            path=str(settings.staff_csv_path),
            hint="Place hospital_staff.csv in data/ directory",
        )

    yield

    logger.info("app_shutdown")


app = FastAPI(
    title="Hospital Knowledge Assistant API",
    description=(
        "RAG-powered hospital knowledge base assistant. "
        "Authorized hospital staff can query clinical protocols, "
        "drug interaction guidelines, and policy circulars."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed_ms = round((time.time() - start) * 1000, 1)
    response.headers["X-Response-Time-Ms"] = str(elapsed_ms)
    return response


# Global error handler — prevents raw stack traces from reaching the user
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# Mount routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    from backend.monitoring.metrics import get_metrics
    m = get_metrics()
    return {
        "status": "healthy",
        "env": settings.app_env,
        "uptime_seconds": round(m.uptime_seconds, 1),
        "staff_file_available": settings.staff_csv_path.exists(),
        "documents_dir_available": settings.documents_path.exists(),
    }


@app.get("/")
async def root() -> dict:
    return {
        "application": "Hospital Knowledge Assistant",
        "version": "1.0.0",
        "docs": "/docs",
    }
