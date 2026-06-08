from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session, select
from database import get_session
from models import Contact, WhatsAppSession, User, Agent, BulkContact
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
    "lg_code": ["lgcode", "lg_code", "lg", "agentcode", "agentlgcode"],
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
    "card_active_status": ["cardactivestatus", "cardactive", "cardactivationstate", "cardactivatestate"],
    "application_id": ["applicationid", "appid", "applicationno"],
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
    excel_updated: Optional[bool] = None

    # Excel Matched Fields
    creation_date_time: Optional[str] = None
    customer_type: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    lg_code: Optional[str] = None
    ipa_status: Optional[str] = None
    dropoff_reason: Optional[str] = None
    idcom_status: Optional[str] = None
    vkyc_status: Optional[str] = None
    vkyc_consent_date: Optional[str] = None
    vkyc_expiry_date: Optional[str] = None
    capture_link: Optional[str] = None
    final_decision: Optional[str] = None
    final_decision_date: Optional[str] = None
    current_stage: Optional[str] = None
    kyc_status: Optional[str] = None
    decline_type: Optional[str] = None
    product_des: Optional[str] = None
    kyc_success_nr: Optional[str] = None
    card_type: Optional[str] = None
    card_active_status: Optional[str] = None
    application_id: Optional[str] = None
    remarks: Optional[str] = None

    # Location & Agent Details
    executive_name: Optional[str] = None
    executive_code: Optional[str] = None
    agent_city: Optional[str] = None
    agent_place: Optional[str] = None
    agent_venue: Optional[str] = None

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
    limit: Optional[int] = Query(None, ge=1),
    offset: int = Query(0, ge=0)
):
    from sqlmodel import text
    
    # Dynamic heal/enrichment for unmatched agent fields
    try:
        agent_leads = db.exec(
            select(Contact)
            .where(Contact.lg_code != None)
        ).all()
        if agent_leads:
            agents = db.exec(select(Agent)).all()
            agent_map_by_user = {(a.user_id, a.lg_code.strip().upper()): a for a in agents}
            agent_map_global = {a.lg_code.strip().upper(): a for a in agents}
            healed = False
            for lead in agent_leads:
                lg_val = str(lead.lg_code).strip()
                if lg_val and lg_val.upper() != "N/A" and lg_val != "":
                    key = (lead.user_id, lg_val.upper())
                    agent_info = agent_map_by_user.get(key) or agent_map_global.get(lg_val.upper())
                    if agent_info:
                        # Heal if unpopulated OR if details differ from latest database values
                        if (not lead.executive_name or 
                            lead.executive_name.strip() in ["", "N/A"] or
                            lead.executive_name != agent_info.executive_name or
                            lead.executive_code != agent_info.executive_code or
                            lead.agent_city != agent_info.city or
                            lead.agent_place != agent_info.place or
                            lead.agent_venue != agent_info.venue):
                            
                            lead.executive_name = agent_info.executive_name
                            lead.executive_code = agent_info.executive_code
                            lead.agent_city = agent_info.city
                            lead.agent_place = agent_info.place
                            lead.agent_venue = agent_info.venue
                            db.add(lead)
                            healed = True
            if healed:
                db.commit()
    except Exception as e:
        print("Dynamic agent enrichment skipped:", e)
        
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
    
    if limit is not None:
        statement = statement.limit(limit)
    if offset > 0:
        statement = statement.offset(offset)
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
            "created_at": c.created_at.isoformat() + "Z" if c.created_at else None,
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
            "excel_updated_at": c.excel_updated_at.isoformat() + "Z" if c.excel_updated_at else None,
            # Location & Agent Details
            "executive_name": c.executive_name,
            "executive_code": c.executive_code,
            "agent_city": c.agent_city,
            "agent_place": c.agent_place,
            "agent_venue": c.agent_venue,
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
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    if current_user.role != "superadmin" and contact.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this lead entry")
        
    update_data = contact_update.dict(exclude_unset=True)
    
    # Exclude location & agent details from client updates to enforce server-side lg_code matching
    for field in ["executive_name", "executive_code", "agent_city", "agent_place", "agent_venue"]:
        update_data.pop(field, None)
        
    for key, value in update_data.items():
        setattr(contact, key, value)
        
    # Look up and populate Location & Agent details from matching lg_code if lg_code was updated
    if "lg_code" in update_data:
        lg_val = update_data.get("lg_code")
        if lg_val and str(lg_val).strip() != "" and str(lg_val).strip().upper() != "N/A":
            lg_clean = str(lg_val).strip()
            from sqlmodel import func
            agent_info = db.exec(
                select(Agent)
                .where(func.upper(Agent.lg_code) == lg_clean.upper())
                .where(Agent.user_id == contact.user_id)
            ).first()
            if not agent_info:
                agent_info = db.exec(
                    select(Agent)
                    .where(func.upper(Agent.lg_code) == lg_clean.upper())
                    .where(Agent.user_id == current_user.id)
                ).first()
            if not agent_info:
                agent_info = db.exec(
                    select(Agent)
                    .where(func.upper(Agent.lg_code) == lg_clean.upper())
                ).first()
                
            if agent_info:
                contact.executive_name = agent_info.executive_name
                contact.executive_code = agent_info.executive_code
                contact.agent_city = agent_info.city
                contact.agent_place = agent_info.place
                contact.agent_venue = agent_info.venue
            else:
                contact.executive_name = "N/A"
                contact.executive_code = "N/A"
                contact.agent_city = "N/A"
                contact.agent_place = "N/A"
                contact.agent_venue = "N/A"
        else:
            contact.executive_name = "N/A"
            contact.executive_code = "N/A"
            contact.agent_city = "N/A"
            contact.agent_place = "N/A"
            contact.agent_venue = "N/A"
        
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    owner = db.get(User, contact.user_id)
    enriched_contact = contact.dict()
    enriched_contact["created_at"] = (contact.created_at.isoformat() + "Z") if contact.created_at else None
    if contact.excel_updated_at:
        enriched_contact["excel_updated_at"] = (contact.excel_updated_at.isoformat() + "Z") if contact.excel_updated_at else None
    enriched_contact["owner_company"] = owner.company_name if owner else None
    enriched_contact["owner_name"] = owner.display_name if owner else None
    enriched_contact["owner_email"] = owner.email if owner else None
    
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
    unmatched_seen = set()
    
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
            
            # Look up and populate Location & Agent details from matching lg_code
            if lead.lg_code and str(lead.lg_code).strip() != "" and str(lead.lg_code).strip().upper() != "N/A":
                lg_clean = str(lead.lg_code).strip()
                from sqlmodel import func
                agent_info = db.exec(
                    select(Agent)
                    .where(func.upper(Agent.lg_code) == lg_clean.upper())
                    .where(Agent.user_id == lead.user_id)
                ).first()
                if not agent_info:
                    agent_info = db.exec(
                        select(Agent)
                        .where(func.upper(Agent.lg_code) == lg_clean.upper())
                        .where(Agent.user_id == current_user.id)
                    ).first()
                if not agent_info:
                    agent_info = db.exec(
                        select(Agent)
                        .where(func.upper(Agent.lg_code) == lg_clean.upper())
                    ).first()
                
                if agent_info:
                    lead.executive_name = agent_info.executive_name
                    lead.executive_code = agent_info.executive_code
                    lead.agent_city = agent_info.city
                    lead.agent_place = agent_info.place
                    lead.agent_venue = agent_info.venue
                else:
                    lead.executive_name = "N/A"
                    lead.executive_code = "N/A"
                    lead.agent_city = "N/A"
                    lead.agent_place = "N/A"
                    lead.agent_venue = "N/A"
            else:
                lead.executive_name = "N/A"
                lead.executive_code = "N/A"
                lead.agent_city = "N/A"
                lead.agent_place = "N/A"
                lead.agent_venue = "N/A"
            
            db.add(lead)
            matched_count += 1
        else:
            if arn_str not in unmatched_seen:
                unmatched_seen.add(arn_str)
                # Check why it's unmatched (exist globally vs absent)
                global_lead = db.exec(select(Contact).where(Contact.arn == arn_str)).first()
                if global_lead:
                    unmatched_arns.append({
                        "arn": arn_str,
                        "reason": "Belongs to another company"
                    })
                else:
                    unmatched_arns.append({
                        "arn": arn_str,
                        "reason": "Not found in database"
                    })
            
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
        "unmatched_arns": unmatched_arns,
        "unmatched_count": len(unmatched_arns),
        "mapped_columns": mapped_columns
    }

@router.get("/export-matched")
async def export_matched_contacts(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_user_from_token_or_query)
):
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    
    statement = select(Contact).where(Contact.excel_updated == True).order_by(Contact.created_at.desc())
    if current_user.role != "superadmin":
        statement = statement.where(Contact.user_id == current_user.id)
        
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            statement = statement.where(Contact.created_at >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
            
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            statement = statement.where(Contact.created_at <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")
            
    contacts = db.exec(statement).all()
    
    if not contacts:
        raise HTTPException(status_code=404, detail="No matched leads found in the selected date range.")
        
    # Prepare data
    data = []
    for c in contacts:
        owner = db.get(User, c.user_id)
        data.append({
            "ARN Ref": c.arn or "",
            "Name": c.extracted_name or "",
            "Mobile": c.mobile or "",
            "Email": c.email or "",
            "Session ID": c.session_id or "",
            "Owner Company": owner.company_name if owner else "",
            "Lead Score": c.lead_score or "",
            "Confidence": f"{c.confidence * 100:.1f}%" if c.confidence else "",
            "Source Message": c.source_message or "",
            "Source Type": c.source_type or "",
            "WhatsApp JID": c.wa_jid or "",
            "WhatsApp Created At": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
            
            # Excel Matched Fields
            "Creation DateTime (Excel)": c.creation_date_time or "",
            "Customer Type": c.customer_type or "",
            "State": c.state or "",
            "Pincode": c.pincode or "",
            "LG Code": c.lg_code or "",
            "IPA Status": c.ipa_status or "",
            "DropOff Reason": c.dropoff_reason or "",
            "Idcom Status": c.idcom_status or "",
            "VKYC Status": c.vkyc_status or "",
            "VKYC Consent Date": c.vkyc_consent_date or "",
            "VKYC Expiry Date": c.vkyc_expiry_date or "",
            "Capture Link": c.capture_link or "",
            "Final Decision": c.final_decision or "",
            "Final Decision Date": c.final_decision_date or "",
            "Current Stage": c.current_stage or "",
            "KYC Status": c.kyc_status or "",
            "Decline Type": c.decline_type or "",
            "Product Description": c.product_des or "",
            "KYC Success/NR": c.kyc_success_nr or "",
            "Card Type": c.card_type or "",
            "Card Active Status": c.card_active_status or "",
            "Application ID": c.application_id or "",
            "Remarks": c.remarks or "",
            # Location & Agent Details
            "Executive Name": c.executive_name or "",
            "Executive Code": c.executive_code or "",
            "City": c.agent_city or "",
            "Place": c.agent_place or "",
            "Venue": c.agent_venue or "",
            "Excel Match Synced At": c.excel_updated_at.strftime("%Y-%m-%d %H:%M:%S") if c.excel_updated_at else ""
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Matched Leads')
        
    output.seek(0)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"chatleads_matched_export_{timestamp}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==========================================
# Bulk Lead Management Endpoints
# ==========================================

class BulkApproveMultiple(BaseModel):
    bulk_ids: List[int]

@router.get("/bulk")
async def get_bulk_contacts(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    session_id: Optional[str] = None,
    status: str = Query("pending"),  # pending, added, all
    query: Optional[str] = None,
    limit: Optional[int] = Query(None, ge=1),
    offset: int = Query(0, ge=0)
):
    statement = select(BulkContact).order_by(BulkContact.created_at.desc())
    if current_user.role != "superadmin":
        statement = statement.where(BulkContact.user_id == current_user.id)
    
    if session_id:
        statement = statement.where(BulkContact.session_id == session_id)
        
    if status != "all":
        statement = statement.where(BulkContact.status == status)
        
    if query:
        statement = statement.where(
            (BulkContact.extracted_name.contains(query)) | 
            (BulkContact.email.contains(query)) | 
            (BulkContact.mobile.contains(query)) |
            (BulkContact.arn.contains(query))
        )
        
    if limit is not None:
        statement = statement.limit(limit)
    if offset > 0:
        statement = statement.offset(offset)
    bulk_contacts = db.exec(statement).all()
    
    result = []
    for bc in bulk_contacts:
        owner = db.get(User, bc.user_id)
        result.append({
            "id": bc.id,
            "session_id": bc.session_id,
            "wa_jid": bc.wa_jid,
            "group_jid": bc.group_jid,
            "extracted_name": bc.extracted_name,
            "mobile": bc.mobile,
            "email": bc.email,
            "arn": bc.arn,
            "confidence": bc.confidence,
            "lead_score": bc.lead_score,
            "source_message": bc.source_message,
            "status": bc.status,
            "created_at": bc.created_at.isoformat() + "Z" if bc.created_at else None,
            "owner_company": owner.company_name if owner else None
        })
        
    return result

@router.post("/bulk/{bulk_id}/approve")
async def approve_bulk_contact(
    bulk_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    bc = db.get(BulkContact, bulk_id)
    if not bc:
        raise HTTPException(status_code=404, detail="Bulk contact not found")
        
    if current_user.role != "superadmin" and bc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this bulk lead")
        
    if bc.status == "added":
        raise HTTPException(status_code=400, detail="Lead already approved")
        
    # Check duplicate in standard Contact table before creating
    existing_contact = None
    if bc.mobile:
        existing_contact = db.exec(select(Contact).where(
            Contact.session_id == bc.session_id,
            Contact.mobile == bc.mobile
        )).first()
    if not existing_contact and bc.email:
        existing_contact = db.exec(select(Contact).where(
            Contact.session_id == bc.session_id,
            Contact.email == bc.email
        )).first()
        
    if existing_contact:
        bc.status = "added"
        db.add(bc)
        db.commit()
        db.refresh(bc)
        return {"status": "success", "message": "Lead was already in standard leads", "contact_id": existing_contact.id}
        
    # Promote to Contact
    contact_data = {
        "user_id": bc.user_id,
        "session_id": bc.session_id,
        "wa_jid": bc.wa_jid,
        "group_jid": bc.group_jid,
        "extracted_name": bc.extracted_name,
        "mobile": bc.mobile,
        "email": bc.email,
        "arn": bc.arn,
        "confidence": bc.confidence,
        "lead_score": bc.lead_score or "Cold",
        "source_message": bc.source_message or "[approved from bulk]",
        "source_type": "image_bulk"
    }
    
    contact = Contact(**contact_data)
    db.add(contact)
    bc.status = "added"
    db.add(bc)
    
    db.commit()
    db.refresh(contact)
    db.refresh(bc)
    
    # Broadcast updates to notify both Leads and Bulk Data grids
    try:
        from core.ws import manager
        await manager.broadcast({
            "event": "lead_updated",
            "data": {
                "action": "created",
                "id": contact.id,
                "name": contact.extracted_name,
                "mobile": contact.mobile,
                "email": contact.email,
                "arn": contact.arn,
                "score": contact.lead_score,
                "session": contact.session_id
            }
        })
        await manager.broadcast({
            "event": "bulk_lead_updated",
            "data": {
                "action": "approved",
                "session": bc.session_id,
                "id": bc.id
            }
        })
    except Exception as e:
        print("WS broadcast failed in bulk approve:", e)
        
    return {"status": "success", "contact_id": contact.id}

@router.post("/bulk/approve-multiple")
async def approve_multiple_bulk_contacts(
    payload: BulkApproveMultiple,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    approved_count = 0
    sessions_to_notify = set()
    
    for bulk_id in payload.bulk_ids:
        bc = db.get(BulkContact, bulk_id)
        if not bc or bc.status == "added":
            continue
            
        if current_user.role != "superadmin" and bc.user_id != current_user.id:
            continue
            
        sessions_to_notify.add(bc.session_id)
        
        # Check duplicate
        existing_contact = None
        if bc.mobile:
            existing_contact = db.exec(select(Contact).where(
                Contact.session_id == bc.session_id,
                Contact.mobile == bc.mobile
            )).first()
        if not existing_contact and bc.email:
            existing_contact = db.exec(select(Contact).where(
                Contact.session_id == bc.session_id,
                Contact.email == bc.email
            )).first()
            
        if existing_contact:
            bc.status = "added"
            db.add(bc)
            approved_count += 1
            continue
            
        contact_data = {
            "user_id": bc.user_id,
            "session_id": bc.session_id,
            "wa_jid": bc.wa_jid,
            "group_jid": bc.group_jid,
            "extracted_name": bc.extracted_name,
            "mobile": bc.mobile,
            "email": bc.email,
            "arn": bc.arn,
            "confidence": bc.confidence,
            "lead_score": bc.lead_score or "Cold",
            "source_message": bc.source_message or "[approved from bulk]",
            "source_type": "image_bulk"
        }
        
        contact = Contact(**contact_data)
        db.add(contact)
        bc.status = "added"
        db.add(bc)
        approved_count += 1
        
    db.commit()
    
    # Broadcast updates
    try:
        from core.ws import manager
        await manager.broadcast({
            "event": "lead_updated",
            "data": {
                "action": "bulk_excel_upload", # triggers reload of leads list
            }
        })
        for s_id in sessions_to_notify:
            await manager.broadcast({
                "event": "bulk_lead_updated",
                "data": {
                    "action": "approved_multiple",
                    "session": s_id,
                    "count": approved_count
                }
            })
    except Exception as e:
        print("WS broadcast failed in multi approve:", e)
        
    return {"status": "success", "approved_count": approved_count}

@router.delete("/bulk/{bulk_id}")
async def delete_bulk_contact(
    bulk_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    bc = db.get(BulkContact, bulk_id)
    if not bc:
        raise HTTPException(status_code=404, detail="Bulk contact not found")
        
    if current_user.role != "superadmin" and bc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this bulk lead")
        
    session_id = bc.session_id
    db.delete(bc)
    db.commit()
    
    try:
        from core.ws import manager
        await manager.broadcast({
            "event": "bulk_lead_updated",
            "data": {"action": "delete", "id": bulk_id, "session": session_id}
        })
    except Exception as ws_err:
        print("WS broadcast failed in bulk delete:", ws_err)
        
    return {"status": "success"}

@router.delete("/bulk-all/clear")
async def delete_all_bulk_contacts(
    session_id: Optional[str] = None,
    status: str = Query("pending"),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(BulkContact)
    if current_user.role != "superadmin":
        statement = statement.where(BulkContact.user_id == current_user.id)
        
    if session_id:
        statement = statement.where(BulkContact.session_id == session_id)
        
    if status != "all":
        statement = statement.where(BulkContact.status == status)
        
    bulk_to_delete = db.exec(statement).all()
    count = len(bulk_to_delete)
    
    for bc in bulk_to_delete:
        db.delete(bc)
        
    db.commit()
    
    try:
        from core.ws import manager
        await manager.broadcast({
            "event": "bulk_lead_updated",
            "data": {"action": "delete_all", "count": count, "session": session_id}
        })
    except Exception as ws_err:
        print("WS broadcast failed in bulk delete all:", ws_err)
        
    return {"status": "success", "deleted_count": count}