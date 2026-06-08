from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from database import get_session
from models import Contact, WhatsAppSession, User, BulkContact
from typing import Dict, List
from core.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/overview")
async def get_overview_stats(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.role == "superadmin":
            # 1. Total Counts with safety
            total_leads = db.query(func.count(Contact.id)).scalar() or 0
            active_sessions = db.query(func.count(WhatsAppSession.id)).filter(WhatsAppSession.status == "connected").scalar() or 0
            total_bulk = db.query(func.count(BulkContact.id)).filter(BulkContact.status == "pending").scalar() or 0
            
            # 2. Lead Scoring Breakdown
            hot_leads = db.query(func.count(Contact.id)).filter(Contact.lead_score == "Hot").scalar() or 0
            warm_leads = db.query(func.count(Contact.id)).filter(Contact.lead_score == "Warm").scalar() or 0
            cold_leads = db.query(func.count(Contact.id)).filter(Contact.lead_score == "Cold").scalar() or 0
            
            # 3. Performance by Session
            session_perf = []
            sessions = db.query(WhatsAppSession).all()
            for s in sessions:
                count = db.query(func.count(Contact.id)).filter(Contact.session_id == s.session_id).scalar() or 0
                session_perf.append({
                    "name": s.session_id.replace("_", " ").capitalize(),
                    "leads": count
                })

            # 4. Recent Activity
            recent_leads = db.query(Contact).order_by(Contact.created_at.desc()).limit(5).all()
        else:
            # 1. Total Counts with safety
            total_leads = db.query(func.count(Contact.id)).filter(Contact.user_id == current_user.id).scalar() or 0
            active_sessions = db.query(func.count(WhatsAppSession.id)).filter(WhatsAppSession.status == "connected", WhatsAppSession.user_id == current_user.id).scalar() or 0
            total_bulk = db.query(func.count(BulkContact.id)).filter(BulkContact.status == "pending", BulkContact.user_id == current_user.id).scalar() or 0
            
            # 2. Lead Scoring Breakdown
            hot_leads = db.query(func.count(Contact.id)).filter(Contact.lead_score == "Hot", Contact.user_id == current_user.id).scalar() or 0
            warm_leads = db.query(func.count(Contact.id)).filter(Contact.lead_score == "Warm", Contact.user_id == current_user.id).scalar() or 0
            cold_leads = db.query(func.count(Contact.id)).filter(Contact.lead_score == "Cold", Contact.user_id == current_user.id).scalar() or 0
            
            # 3. Performance by Session
            session_perf = []
            sessions = db.query(WhatsAppSession).filter(WhatsAppSession.user_id == current_user.id).all()
            for s in sessions:
                count = db.query(func.count(Contact.id)).filter(Contact.session_id == s.session_id, Contact.user_id == current_user.id).scalar() or 0
                session_perf.append({
                    "name": s.session_id.replace("_", " ").capitalize(),
                    "leads": count
                })

            # 4. Recent Activity
            recent_leads = db.query(Contact).filter(Contact.user_id == current_user.id).order_by(Contact.created_at.desc()).limit(5).all()

        activity = [{
            "id": l.id,
            "name": l.extracted_name or "Anonymous",
            "score": l.lead_score or "Warm",
            "time": l.created_at.isoformat() + "Z" if l.created_at else None,
            "session": l.session_id or "fleet",
            "message": l.source_message
        } for l in recent_leads]

        return {
            "total_leads": total_leads,
            "active_fleet": active_sessions,
            "total_bulk": total_bulk,
            "hot_leads": hot_leads,
            "warm_leads": warm_leads,
            "cold_leads": cold_leads,
            "hot_ratio": round((hot_leads / total_leads * 100) if total_leads > 0 else 0),
            "summary": {
                "total_leads": total_leads,
                "active_fleet": active_sessions,
                "total_bulk": total_bulk,
                "hot_ratio": round((hot_leads / total_leads * 100) if total_leads > 0 else 0),
            },
            "scoring": {
                "hot": hot_leads,
                "warm": warm_leads,
                "cold": cold_leads
            },
            "fleet": session_perf,
            "recent": activity
        }
    except Exception as e:
        print(f"❌ Stats Error: {str(e)}")
        return {
            "total_leads": 0,
            "active_fleet": 0,
            "total_bulk": 0,
            "hot_leads": 0,
            "warm_leads": 0,
            "cold_leads": 0,
            "hot_ratio": 0,
            "summary": {"total_leads": 0, "active_fleet": 0, "total_bulk": 0, "hot_ratio": 0},
            "scoring": {"hot": 0, "warm": 0, "cold": 0},
            "fleet": [],
            "recent": []
        }
