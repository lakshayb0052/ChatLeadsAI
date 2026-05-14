from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session, engine
from models import WhatsAppSession, User
from pydantic import BaseModel
from typing import Optional
import httpx
import datetime

router = APIRouter(prefix="/sessions", tags=["sessions"])

class QRSync(BaseModel):
    session_id: str
    qr_code: str
    status: Optional[str] = "linking"

@router.post("/update-qr")
async def update_qr(data: QRSync, db: Session = Depends(get_session)):
    try:
        print(f">>> SYNC START: {data.session_id} [{data.status}]")
        
        # 1. Ensure User 1 exists (Fail-safe)
        user = db.get(User, 1)
        if not user:
            print("!!! WARNING: Admin user missing. Auto-creating...")
            from core.auth import get_password_hash
            user = User(id=1, email="admin@chatleads.ai", hashed_password=get_password_hash("admin123"), is_active=True)
            db.add(user)
            db.commit()
            db.refresh(user)

        # 2. Find or Create Session
        statement = select(WhatsAppSession).where(WhatsAppSession.session_id == data.session_id)
        session = db.exec(statement).first()
        
        if not session:
            print(f"Creating new session record: {data.session_id}")
            session = WhatsAppSession(
                user_id=1, 
                session_id=data.session_id, 
                status=data.status or "linking",
                qr_code=data.qr_code,
                last_seen=datetime.datetime.utcnow()
            )
            db.add(session)
        else:
            print(f"Updating existing session: {data.session_id}")
            session.qr_code = data.qr_code
            session.status = data.status or "linking"
            session.last_seen = datetime.datetime.utcnow()
        
        # 3. Save to Database
        db.commit()
        db.refresh(session)
        print(f"✅ DB Updated: {session.session_id} -> {session.status}")

        # 4. Broadcast Real-Time Update
        try:
            from core.ws import manager
            await manager.broadcast({
                "event": "session_updated", 
                "data": {"status": session.status, "qr": session.qr_code}
            })
            print("📡 WebSocket Broadcast Sent")
        except Exception as ws_err:
            print(f"Non-critical WS Error: {ws_err}")
            
        return {"status": "success", "session": data.session_id}

    except Exception as e:
        print(f"❌ CRITICAL ERROR in update_qr: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Sync Error: {str(e)}")

@router.post("/create")
async def create_new_session(data: dict, db: Session = Depends(get_session)):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    
    # Notify WhatsApp Hub to start new instance
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8001/sessions/start", json={"session_id": session_id})
    except Exception as e:
        print(f"Error starting session in Hub: {e}")

    # Create placeholder in DB
    session = db.query(WhatsAppSession).filter(WhatsAppSession.session_id == session_id).first()
    if not session:
        session = WhatsAppSession(user_id=1, session_id=session_id, status="linking")
        db.add(session)
        db.commit()
    
    return {"status": "initializing", "session_id": session_id}

@router.post("/revoke/{session_id}")
async def revoke_session(session_id: str, db: Session = Depends(get_session)):
    session = db.query(WhatsAppSession).filter(WhatsAppSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"http://localhost:8001/logout", json={"session_id": session_id})
    except Exception as e:
        print(f"Error calling WhatsApp service: {e}")
    
    session.status = "disconnected"
    session.qr_code = None
    db.commit()

    from core.ws import manager
    await manager.broadcast({
        "event": "session_updated", 
        "data": {"status": "disconnected", "qr": None}
    })

    return {"status": "revoked"}

@router.get("/status/{session_id}")
async def get_status(session_id: str, db: Session = Depends(get_session)):
    session = db.query(WhatsAppSession).filter(WhatsAppSession.session_id == session_id).first()
    if not session:
        return {"status": "disconnected", "qr": None}
    return {"status": session.status, "qr": session.qr_code}

@router.get("/")
async def list_sessions(db: Session = Depends(get_session)):
    sessions = db.query(WhatsAppSession).all()
    return sessions

@router.delete("/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_session)):
    try:
        session = db.query(WhatsAppSession).filter(WhatsAppSession.session_id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # 1. KILL the instance in the WhatsApp Hub
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"http://localhost:8001/sessions/stop", json={"session_id": session_id})
            
            # Give the device time to process the remote logout signal
            import asyncio
            await asyncio.sleep(2)
        except Exception as e:
            print(f"Non-critical: Hub stop failed: {e}")

        # 2. ANNIHILATE from database
        db.delete(session)
        db.commit()
        print(f"🔥 Session {session_id} permanently removed from database.")

        # 3. Notify frontend
        from core.ws import manager
        await manager.broadcast({
            "event": "session_updated", 
            "data": {"status": "deleted", "session_id": session_id}
        })

        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
