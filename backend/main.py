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
from api import webhooks, contacts, sessions, stats
from core.ws import manager
from models import User
from database import get_session
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    
    # Seed default user if not exists
    with Session(engine) as session:
        from sqlmodel import select
        admin = session.exec(select(User).where(User.id == 1)).first()
        if not admin:
            logger.info("Seeding default admin user...")
            admin = User(id=1, email="admin@chatleads.ai", hashed_password="hashed_placeholder")
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
