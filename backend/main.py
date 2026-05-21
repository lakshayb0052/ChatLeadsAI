import sys

# Prevent UnicodeEncodeError on Windows when printing emojis
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlmodel import SQLModel, Session
from database import engine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from api import webhooks, contacts, sessions, stats, auth, users
from core.ws import manager
from models import User
from database import get_session
import os
import traceback

# Captured startup error (if any) — exposed via /debug
_startup_error: str = ""

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _startup_error
    try:
        logger.info("=== STARTUP BEGIN ===")
        logger.info(f"DATABASE_URL set: {bool(os.getenv('DATABASE_URL'))}")
        logger.info(f"SECRET_KEY set: {bool(os.getenv('SECRET_KEY'))}")
        logger.info(f"GEMINI_API_KEY set: {bool(os.getenv('GEMINI_API_KEY'))}")

        # Create tables
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        from database import migrate_db
        migrate_db(engine)
        
        # Upsert super admin — always refresh the password hash to recover
        # from any corruption caused by passlib/bcrypt incompatibility on Python 3.14
        with Session(engine) as session:
            from sqlmodel import select
            from core.auth import get_password_hash
            fresh_hash = get_password_hash("Lakshay@123")
            admin = session.exec(select(User).where(User.email == "admin@chatleads.ai")).first()
            if not admin:
                logger.info("Seeding default super admin user...")
                admin = User(
                    email="admin@chatleads.ai",
                    hashed_password=fresh_hash,
                    display_name="lakshay",
                    role="superadmin",
                    company_name="ChatLeads AI",
                    max_sessions=9999
                )
                session.add(admin)
                session.commit()
                logger.info("Super admin seeded successfully.")
            else:
                logger.info("Super admin exists — refreshing all fields with correct values...")
                admin.hashed_password = fresh_hash
                admin.role = "superadmin"
                admin.display_name = "lakshay"
                admin.company_name = "ChatLeads AI"
                admin.max_sessions = 9999
                session.add(admin)
                session.commit()
                logger.info(f"Super admin fully refreshed. Role={admin.role}")
                
        logger.info("=== STARTUP COMPLETE — Database ready! ===")
    except Exception as e:
        _startup_error = traceback.format_exc()
        logger.error(f"=== STARTUP FAILED ===\n{_startup_error}")
        # Don't re-raise — let the app start so /debug is reachable
    yield
    logger.info("Shutting down...")

app = FastAPI(title="ChalLeads AI", lifespan=lifespan)

# CORS — build the allowed origins list from env + known production URLs
_raw_origins = os.getenv("CORS_ORIGINS", "")
_extra = [o.strip() for o in _raw_origins.split(",") if o.strip()]
ALLOWED_ORIGINS = list(set([
    "https://chat-leads-ai.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
] + _extra))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global exception handler — ensures CORS headers are always present even on 500s
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    allow_origin = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(webhooks.router)
app.include_router(contacts.router)
app.include_router(sessions.router)
app.include_router(stats.router)

# Static files
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check(response: Response):
    db_status = "healthy"
    try:
        from sqlmodel import text
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"unhealthy: {str(e)}"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": "healthy" if "unhealthy" not in db_status else "unhealthy",
        "database": db_status,
        "startup_error": _startup_error or None,
    }

@app.get("/debug")
async def debug_info():
    """Diagnostic endpoint — shows env var presence, DB status, and startup errors."""
    db_ok = False
    db_error = None
    try:
        from sqlmodel import text
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_error = str(e)
    
    # Check which tables exist
    tables = []
    try:
        from sqlalchemy import inspect as sa_inspect
        insp = sa_inspect(engine)
        tables = insp.get_table_names()
    except Exception:
        pass

    return {
        "env": {
            "DATABASE_URL_set": bool(os.getenv("DATABASE_URL")),
            "SECRET_KEY_set": bool(os.getenv("SECRET_KEY")),
            "GEMINI_API_KEY_set": bool(os.getenv("GEMINI_API_KEY")),
            "CORS_ORIGINS": os.getenv("CORS_ORIGINS", "(not set)"),
        },
        "database": {
            "connected": db_ok,
            "error": db_error,
            "tables": tables,
        },
        "startup_error": _startup_error or None,
    }

@app.api_route("/", methods=["GET", "HEAD"])
async def root(request: Request):
    if request.method == "HEAD":
        return Response(status_code=status.HTTP_200_OK)
    from fastapi.responses import FileResponse
    return FileResponse("static/dashboard.html")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
