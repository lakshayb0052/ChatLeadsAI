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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    from database import migrate_db
    migrate_db(engine)
    
    # Seed default super admin user if not exists
    with Session(engine) as session:
        from sqlmodel import select
        from core.auth import get_password_hash
        admin = session.exec(select(User).where(User.email == "admin@chatleads.ai")).first()
        if not admin:
            logger.info("Seeding default super admin user...")
            admin = User(
                email="admin@chatleads.ai",
                hashed_password=get_password_hash("Lakshay@123"),
                display_name="lakshay",
                role="superadmin",
                company_name="ChatLeads AI",
                max_sessions=9999
            )
            session.add(admin)
            session.commit()
            
    logger.info("Database ready!")
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(title="ChalLeads AI", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, you can replace with specific Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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
        db_status = "unhealthy"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status
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
