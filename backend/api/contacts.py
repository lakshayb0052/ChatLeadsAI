from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import Contact, WhatsAppSession
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("/")
def get_contacts(
    db: Session = Depends(get_session),
    session_id: Optional[str] = None,
    score: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    statement = select(Contact).order_by(Contact.created_at.desc())
    
    if session_id:
        statement = statement.where(Contact.session_id == session_id)
    if score:
        statement = statement.where(Contact.lead_score == score)
    if query:
        statement = statement.where(
            (Contact.extracted_name.contains(query)) | 
            (Contact.email.contains(query)) | 
            (Contact.mobile.contains(query))
        )
    
    statement = statement.offset(offset).limit(limit)
    return db.exec(statement).all()

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_session)):
    """Get all available WhatsApp sessions with lead counts"""
    sessions = db.exec(select(WhatsAppSession)).all()
    result = []
    for session in sessions:
        lead_count = db.exec(
            select(Contact).where(Contact.session_id == session.session_id)
        ).all()
        result.append({
            "session_id": session.session_id,
            "status": session.status,
            "lead_count": len(lead_count),
            "created_at": session.created_at
        })
    return result

@router.get("/export")
async def export_contacts(
    session_ids: List[str] = Query(..., description="List of session IDs to export"),
    db: Session = Depends(get_session)
):
    """
    Export leads from selected sessions to Excel
    """
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    
    if not session_ids:
        raise HTTPException(status_code=400, detail="Please select at least one session")
    
    print(f"📊 Exporting leads from sessions: {session_ids}")
    
    statement = select(Contact).where(Contact.session_id.in_(session_ids)).order_by(Contact.created_at.desc())
    contacts = db.exec(statement).all()
    
    if not contacts:
        raise HTTPException(status_code=404, detail="No leads found for selected sessions")

    # Prepare data for Excel
    data = []
    for c in contacts:
        data.append({
            "Session ID": c.session_id,
            "Name": c.extracted_name if c.extracted_name != 'absent' else '',
            "Mobile": c.mobile if c.mobile != 'absent' else '',
            "Email": c.email if c.email != 'absent' else '',
            "Lead Score": c.lead_score,
            "Confidence": f"{c.confidence * 100:.1f}%",
            "Source Type": c.source_type,
            "Source Message": c.source_message[:200] + "..." if len(c.source_message or '') > 200 else c.source_message,
            "WhatsApp JID": c.wa_jid,
            "Group JID": c.group_jid or "Direct Message",
            "Created At": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else ""
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel with multiple sheets
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Main sheet
        df.to_excel(writer, index=False, sheet_name='All Leads')
        
        # Summary sheet
        summary = df.groupby(['Session ID', 'Lead Score']).size().unstack(fill_value=0)
        summary.to_excel(writer, sheet_name='Summary')
        
        # Per session sheets
        for session_id in session_ids:
            session_df = df[df['Session ID'] == session_id]
            if not session_df.empty:
                sheet_name = session_id[:31]  # Excel sheet name max 31 chars
                session_df.to_excel(writer, index=False, sheet_name=sheet_name)
    
    output.seek(0)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"chatleads_export_{timestamp}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("/all")
async def delete_all_contacts(db: Session = Depends(get_session)):
    count = db.query(Contact).delete()
    db.commit()
    
    # Notify all dashboards
    from core.ws import manager
    await manager.broadcast({"event": "lead_updated", "data": {"action": "delete_all", "count": count}})
    
    return {"status": "success", "message": f"Deleted {count} contacts"}

@router.delete("/session/{session_id}")
async def delete_session_contacts(session_id: str, db: Session = Depends(get_session)):
    count = db.query(Contact).filter(Contact.session_id == session_id).delete()
    db.commit()
    
    from core.ws import manager
    await manager.broadcast({"event": "lead_updated", "data": {"action": "delete_session", "session_id": session_id}})
    
    return {"status": "success", "message": f"Deleted {count} contacts from session {session_id}"}

@router.delete("/{contact_id}")
async def delete_contact(contact_id: int, db: Session = Depends(get_session)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    
    from core.ws import manager
    await manager.broadcast({"event": "lead_updated", "data": {"action": "delete", "id": contact_id}})
    
    return {"status": "success"}