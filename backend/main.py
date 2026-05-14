from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from database import engine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from api import webhooks, contacts, sessions, stats
from core.ws import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database ready!")
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(title="ChalLeads AI", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/")
async def root():
    from fastapi.responses import FileResponse
    return FileResponse("static/dashboard.html")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
