from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session, select
from database import get_session
from models import Contact, WhatsAppSession, User
from typing import List, Optional
from datetime import datetime
import datetime as dt_module
from core.auth import get_current_user, oauth2_scheme, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from pydantic import BaseModel
import pandas as pd
import io

FIELD_MAPPINGS = {
    "creation_date_time": ["creationdatetime", "creationdate", "datetime", "createdat", "createdtime"],
    "customer_type": ["customertype", "custtype"],
    "state": ["state"],
    "pincode": ["pincode", "pin", "zip", "zipcode"],
    "lg_code": ["lgcode", "lg_code"],
    "ipa_status": ["ipastatus", "ipa"],
    "dropoff_reason": ["dropoffreason", "dropoff"],
    "idcom_status": ["idcomstatus", "idcom"],
    "vkyc_status": ["vkycstatus", "vkyc"],
    "vkyc_consent_date": ["vkycconsentdate", "consentdate"],
    "vkyc_expiry_date": ["vkycexpirydate", "expirydate"],
    "capture_link": ["capturelink", "link"],
    "final_decision": ["finaldecision", "decision"],
    "final_decision_date": ["finaldecisiondate", "decisiondate"],
    "current_stage": ["currentstage", "stage"],
    "kyc_status": ["kycstatus", "kyc"],
    "decline_type": ["declinetype", "decline"],
    "product_des": ["productdes", "productdescription", "productdesc"],
    "kyc_success_nr": ["kycsuccessnr", "kycsuccess", "kycnr"],
    "card_type": ["cardtype", "card"],
    "card_active_status": ["cardactivestatus", "cardactive"],
    "application_id": ["applicationid", "appid"],
    "remarks": ["remarks", "remark"]
}

def clean_header(header: str) -> str:
    return str(header).strip().lower().replace("_", "").replace(" ", "").replace(".", "").replace("/", "")


class ContactUpdate(BaseModel):
    extracted_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    lead_score: Optional[str] = None
    arn: Optional[str] = None

router = APIRouter(prefix="/contacts", tags=["contacts"])

def get_user_from_token_or_query(
    token: Optional[str] = Depends(oauth2_scheme),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_session)
) -> User:
    active_token = token or token_query
    if not active_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(active_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token claims")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = db.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/")
def get_contacts(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    session_id: Optional[str] = None,
    score: Optional[str] = None,
    query: Optional[str] = None,
    excel_updated: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    from sqlmodel import text
    
    statement = select(Contact).order_by(Contact.created_at.desc())
    if current_user.role != "superadmin":
        statement = statement.where(Contact.user_id == current_user.id)
    
    if session_id:
        statement = statement.where(Contact.session_id == session_id)
    if score:
        statement = statement.where(Contact.lead_score == score)
    if excel_updated is not None:
        statement = statement.where(Contact.excel_updated == excel_updated)
    if query:
        statement = statement.where(
            (Contact.extracted_name.contains(query)) | 
            (Contact.email.contains(query)) | 
            (Contact.mobile.contains(query)) |
            (Contact.arn.contains(query))
        )
    
    statement = statement.offset(offset).limit(limit)
    contacts = db.exec(statement).all()
    
    # Enrich each contact with owner's company info
    result = []
    for c in contacts:
        owner = db.get(User, c.user_id)
        item = {
            "id": c.id,
            "extracted_name": c.extracted_name,
            "mobile": c.mobile,
            "email": c.email,
            "arn": c.arn,
            "company": c.company,
            "lead_score": c.lead_score,
            "confidence": c.confidence,
            "source_message": c.source_message,
            "source_type": c.source_type,
            "session_id": c.session_id,
            "wa_jid": c.wa_jid,
            "group_jid": c.group_jid,
            "created_at": c.created_at,
            # Enriched company/owner info
            "owner_company": owner.company_name if owner else None,
            "owner_name": owner.display_name if owner else None,
            "owner_email": owner.email if owner else None,
            # Excel Matched Fields
            "creation_date_time": c.creation_date_time,
            "customer_type": c.customer_type,
            "state": c.state,
            "pincode": c.pincode,
            "lg_code": c.lg_code,
            "ipa_status": c.ipa_status,
            "dropoff_reason": c.dropoff_reason,
            "idcom_status": c.idcom_status,
            "vkyc_status": c.vkyc_status,
            "vkyc_consent_date": c.vkyc_consent_date,
            "vkyc_expiry_date": c.vkyc_expiry_date,
            "capture_link": c.capture_link,
            "final_decision": c.final_decision,
            "final_decision_date": c.final_decision_date,
            "current_stage": c.current_stage,
            "kyc_status": c.kyc_status,
            "decline_type": c.decline_type,
            "product_des": c.product_des,
            "kyc_success_nr": c.kyc_success_nr,
            "card_type": c.card_type,
            "card_active_status": c.card_active_status,
            "application_id": c.application_id,
            "remarks": c.remarks,
            "excel_updated": c.excel_updated,
            "excel_updated_at": c.excel_updated_at.isoformat() if c.excel_updated_at else None,
        }
        result.append(item)
    
    return result


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all available WhatsApp sessions with lead counts and company info"""
    from sqlalchemy import func
    
    statement = select(Contact.session_id, Contact.user_id, func.count(Contact.id)).group_by(Contact.session_id, Contact.user_id)
    if current_user.role != "superadmin":
        statement = statement.where(Contact.user_id == current_user.id)
    results = db.exec(statement).all()
    
    sessions_data = []
    for session_id, user_id, count in results:
        if session_id:
            owner = db.get(User, user_id)
            sessions_data.append({
                "session_id": session_id,
                "status": "archived/active",
                "lead_count": count,
                "created_at": None,
                "owner_company": owner.company_name if owner else None,
                "owner_name": owner.display_name if owner else None,
            })
            
    return sessions_data

@router.get("/export")
async def export_contacts(
    session_ids: List[str] = Query(None),
    score: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_user_from_token_or_query)
):
    """
    Export leads applying all dashboard filters to Excel
    """
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    
    print(f"📊 Exporting leads with filters: sessions={session_ids}, score={score}, query={query}")
    
    statement = select(Contact).order_by(Contact.created_at.desc())
    if current_user.role != "superadmin":
        statement = statement.where(Contact.user_id == current_user.id)
    
    if session_ids:
        statement = statement.where(Contact.session_id.in_(session_ids))
    if score:
        statement = statement.where(Contact.lead_score == score)
    if query:
        statement = statement.where(
            (Contact.extracted_name.contains(query)) | 
            (Contact.email.contains(query)) | 
            (Contact.mobile.contains(query))
        )
    
    contacts = db.exec(statement).all()
    
    if not contacts:
        raise HTTPException(status_code=404, detail="No leads found matching the selected filters")

    # Prepare data for Excel
    data = []
    for c in contacts:
        data.append({
            "Session ID": c.session_id,
            "Name": c.extracted_name if c.extracted_name != 'absent' else '',
            "Mobile": c.mobile if c.mobile != 'absent' else '',
            "Email": c.email if c.email != 'absent' else '',
            "Application Reference Number (ARN)": c.arn if c.arn and c.arn != 'absent' else '',
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
        if not df.empty:
            summary = df.groupby(['Session ID', 'Lead Score']).size().unstack(fill_value=0)
            summary.to_excel(writer, sheet_name='Summary')
            
            # Per session sheets
            session_ids_present = df['Session ID'].unique()
            for s_id in session_ids_present:
                session_df = df[df['Session ID'] == s_id]
                if not session_df.empty:
                    sheet_name = str(s_id)[:31]  # Excel sheet name max 31 chars
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
async def delete_all_contacts(
    session_id: Optional[str] = None,
    company: Optional[str] = None,
    score: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Contact)
    
    if current_user.role != "superadmin":
        statement = statement.where(Contact.user_id == current_user.id)
        
    if session_id:
        statement = statement.where(Contact.session_id == session_id)
        
    if company:
        # Get users belonging to this company
        user_ids = db.exec(select(User.id).where(User.company_name == company)).all()
        statement = statement.where(Contact.user_id.in_(user_ids))
        
    if score:
        statement = statement.where(Contact.lead_score == score)
        
    if query:
        statement = statement.where(
            (Contact.extracted_name.contains(query)) | 
            (Contact.email.contains(query)) | 
            (Contact.mobile.contains(query))
        )
        
    # Fetch all matching contacts to delete them
    contacts_to_delete = db.exec(statement).all()
    count = len(contacts_to_delete)
    
    for contact in contacts_to_delete:
        db.delete(contact)
        
    db.commit()
    
    # Notify all dashboards
    from core.ws import manager
    await manager.broadcast({"event": "lead_updated", "data": {"action": "delete_all", "count": count}})
    
    return {"status": "success", "message": f"Deleted {count} contacts"}

@router.delete("/session/{session_id}")
async def delete_session_contacts(
    session_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify session belongs to user
    session = db.query(WhatsAppSession).filter(WhatsAppSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.role != "superadmin" and session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
        
    count = db.query(Contact).filter(Contact.session_id == session_id).delete()
    db.commit()
    
    from core.ws import manager
    await manager.broadcast({"event": "lead_updated", "data": {"action": "delete_session", "session_id": session_id}})
    
    return {"status": "success", "message": f"Deleted {count} contacts from session {session_id}"}

@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    if current_user.role != "superadmin" and contact.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this contact")
    
    db.delete(contact)
    db.commit()
    
    from core.ws import manager
    await manager.broadcast({"event": "lead_updated", "data": {"action": "delete", "id": contact_id}})
    
    return {"status": "success"}

@router.put("/{contact_id}")
async def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Forbidden: Only superadmins are allowed to edit leads")
        
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    update_data = contact_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contact, key, value)
        
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    owner = db.get(User, contact.user_id)
    enriched_contact = {
        "id": contact.id,
        "extracted_name": contact.extracted_name,
        "mobile": contact.mobile,
        "email": contact.email,
        "arn": contact.arn,
        "company": contact.company,
        "lead_score": contact.lead_score,
        "confidence": contact.confidence,
        "source_message": contact.source_message,
        "source_type": contact.source_type,
        "session_id": contact.session_id,
        "wa_jid": contact.wa_jid,
        "group_jid": contact.group_jid,
        "created_at": contact.created_at.isoformat() if hasattr(contact.created_at, 'isoformat') else str(contact.created_at),
        "owner_company": owner.company_name if owner else None,
        "owner_name": owner.display_name if owner else None,
        "owner_email": owner.email if owner else None,
    }
    
    from core.ws import manager
    await manager.broadcast({
        "event": "lead_updated",
        "data": {
            "action": "update",
            "contact": enriched_contact
        }
    })
    
    return enriched_contact

@router.post("/upload-excel")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check extension
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls") or file.filename.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx, .xls) or CSV files are supported.")
    
    try:
        contents = await file.read()
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read spreadsheet file: {str(e)}")
    
    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded spreadsheet is empty.")
    
    # Clean and identify headers in the Excel sheet
    headers = list(df.columns)
    cleaned_headers_map = {clean_header(h): h for h in headers}
    
    # Find the ARN column
    arn_col_candidates = ["arn", "arnno", "arnnumber", "applicationreferencenumber", "refno", "referenceno"]
    arn_column_original = None
    for candidate in arn_col_candidates:
        if candidate in cleaned_headers_map:
            arn_column_original = cleaned_headers_map[candidate]
            break
            
    if not arn_column_original:
        # Fallback: check if any cleaned header contains "arn"
        for ch, oh in cleaned_headers_map.items():
            if "arn" in ch:
                arn_column_original = oh
                break
                
    if not arn_column_original:
        raise HTTPException(
            status_code=400,
            detail="Could not find an 'ARN' or 'Application Reference Number' column in the spreadsheet. "
                   f"Found columns: {', '.join(headers)}"
        )
        
    # Map other requested columns
    mapped_columns = {} # db_field_name -> original_excel_column_name
    for db_field, candidates in FIELD_MAPPINGS.items():
        for candidate in candidates:
            if candidate in cleaned_headers_map:
                mapped_columns[db_field] = cleaned_headers_map[candidate]
                break
        if db_field not in mapped_columns:
            # Fallback: do a substring check
            for ch, oh in cleaned_headers_map.items():
                if ch == clean_header(arn_column_original):
                    continue
                for cand in candidates:
                    if cand in ch or ch in cand:
                        mapped_columns[db_field] = oh
                        break
                if db_field in mapped_columns:
                    break

    # Perform matching and updates
    total_rows = len(df)
    matched_count = 0
    unmatched_arns = []
    
    for idx, row in df.iterrows():
        arn_val = row[arn_column_original]
        if pd.isna(arn_val):
            continue
            
        arn_str = str(arn_val).strip()
        if not arn_str or arn_str.lower() in ["nan", "none", "absent", ""]:
            continue
            
        # Match lead
        statement = select(Contact).where(Contact.arn == arn_str)
        if current_user.role != "superadmin":
            statement = statement.where(Contact.user_id == current_user.id)
            
        lead = db.exec(statement).first()
        
        if lead:
            # Update mapped details
            for db_field, excel_col in mapped_columns.items():
                val = row[excel_col]
                # Clean value
                if pd.isna(val):
                    setattr(lead, db_field, None)
                else:
                    if isinstance(val, pd.Timestamp):
                        val_str = val.strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        val_str = str(val).strip()
                    
                    if val_str.lower() in ["nan", "none", "null"]:
                        setattr(lead, db_field, None)
                    else:
                        setattr(lead, db_field, val_str)
            
            # Set update tracker
            lead.excel_updated = True
            lead.excel_updated_at = datetime.utcnow()
            
            db.add(lead)
            matched_count += 1
        else:
            unmatched_arns.append(arn_str)
            
    db.commit()
    
    # Notify dashboard via WebSocket
    try:
        from core.ws import manager
        await manager.broadcast({
            "event": "lead_updated",
            "data": {
                "action": "excel_upload",
                "matched_count": matched_count,
                "total_rows": total_rows
            }
        })
    except Exception as ws_err:
        print(f"WebSocket notification error: {ws_err}")
        
    return {
        "status": "success",
        "total_rows": total_rows,
        "matched_count": matched_count,
        "unmatched_arns": unmatched_arns[:100],
        "unmatched_count": len(unmatched_arns),
        "mapped_columns": mapped_columns
    }