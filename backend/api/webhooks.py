from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from database import get_session, engine
from models import Contact, WhatsAppSession, BulkContact, User
from services.extractor import extractor
from pydantic import BaseModel
from typing import Optional, List
import re
from collections import defaultdict
import asyncio
from datetime import datetime
import base64

def normalize_mobile(mobile: str) -> str:
    if not mobile:
        return ""
    digits = "".join(c for c in str(mobile) if c.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits


router = APIRouter(prefix="/webhooks", tags=["webhooks"])

class WhatsAppMessage(BaseModel):
    session_id: str
    sender_jid: str
    sender_name: str
    group_jid: Optional[str] = None
    text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    image_base64: Optional[str] = None

async def process_lead_background(msg: WhatsAppMessage, image_bytes: Optional[bytes]):
    try:
        with Session(engine) as db:
            print(f"\n{'='*60}")
            print(f"🎬 Processing NEW message from {msg.sender_name} ({msg.sender_jid})")
            print(f"📝 Message text: {msg.text}")
            print(f"🆔 Session ID: {msg.session_id}")
            print(f"{'='*60}\n")
            
            # 1. Verify session exists
            session = db.query(WhatsAppSession).filter(WhatsAppSession.session_id == msg.session_id).first()
            if not session:
                print(f"⚠️ Session {msg.session_id} not found. Creating...")
                session = WhatsAppSession(user_id=1, session_id=msg.session_id, status="connected")
                db.add(session)
                db.commit()
                db.refresh(session)

            # 2. Extract lead data from current message ONLY
            # Don't use context from previous messages for extraction
            extracted = await extractor.extract_lead_data(
                text_content=msg.text if msg.text not in ["[image]", "[media]"] else None,
                image_bytes=image_bytes,
                sender_name=msg.sender_name,
                context_messages=[]  # Empty context - only use current message
            )

            # 3. Check if we have valid data in this message
            if not extracted:
                print(f"⚠️ No data extracted from this message")
                return
            
            # Check if session owner has bulk features enabled
            owner_user = db.get(User, session.user_id)
            allow_bulk = owner_user.allow_bulk if owner_user else False
            allow_name = owner_user.allow_name if owner_user else True
            allow_mobile = owner_user.allow_mobile if owner_user else True
            allow_email = owner_user.allow_email if owner_user else True
            allow_arn = owner_user.allow_arn if owner_user else True

            # Check if we have multiple leads in the message/image (bulk leads)
            leads = extracted.get('leads', [])
            
            if len(leads) > 1:
                print(f"📊 BULK Leads Detected! Found {len(leads)} rows.")
                added_bulk_count = 0
                
                # Pre-fetch existing contacts and bulk contacts for this session to run in-memory check
                session_contacts = db.exec(select(Contact).where(Contact.session_id == msg.session_id)).all()
                session_bulk_contacts = db.exec(select(BulkContact).where(BulkContact.session_id == msg.session_id)).all()
                
                for idx, lead in enumerate(leads):
                    l_name = lead.get('name', 'absent') if allow_name else 'absent'
                    l_mobile = lead.get('mobile', 'absent') if allow_mobile else 'absent'
                    l_email = lead.get('email', 'absent') if allow_email else 'absent'
                    l_arn = lead.get('arn', 'absent') if allow_arn else 'absent'
                    
                    # Validate and sanitize
                    has_contact_info = False
                    if l_mobile != "absent" and l_mobile and len(str(l_mobile)) >= 8:
                        has_contact_info = True
                    if l_email != "absent" and l_email and "@" in str(l_email):
                        has_contact_info = True
                        
                    if not has_contact_info:
                        print(f"   [Row {idx+1}] Skipping: No contact (mobile) or email (mail) in this entry.")
                        continue
                        
                    if l_name != "absent" and l_name:
                        l_name_lower = str(l_name).lower().strip()
                        name_blacklist = [
                            "dear students", "dear all", "dear student", "dear candidate", "dear parents",
                            "reporting details", "special pep", "coding test", "announcement", "notice",
                            "sleeping", "busy", "working", "driving", "available", "hello", "hi", "hey",
                            "sir", "madam", "admin", "coordinator", "teacher", "host", "moderator",
                            "whatsapp", "message", "incoming", "outgoing", "class", "session", "dashboard",
                            "group", "team", "regards"
                        ]
                        is_invalid = False
                        for term in name_blacklist:
                            if term == l_name_lower or (len(term) > 4 and term in l_name_lower):
                                is_invalid = True
                                break
                        if is_invalid or len(l_name) > 40 or len(l_name) < 2:
                            l_name = "absent"
                            
                    # Check for existing contact/bulk entry using normalized mobile or email
                    l_mobile_norm = normalize_mobile(l_mobile) if l_mobile != "absent" else ""
                    
                    existing_contact = None
                    existing_bulk = None
                    
                    if l_mobile_norm:
                        existing_contact = next((c for c in session_contacts if normalize_mobile(c.mobile) == l_mobile_norm), None)
                        if not existing_contact:
                            existing_bulk = next((bc for bc in session_bulk_contacts if normalize_mobile(bc.mobile) == l_mobile_norm), None)
                            
                    if not existing_contact and not existing_bulk and l_email != "absent" and l_email:
                        existing_contact = next((c for c in session_contacts if c.email == l_email), None)
                        if not existing_contact:
                            existing_bulk = next((bc for bc in session_bulk_contacts if bc.email == l_email), None)
                            
                    if existing_contact:
                        print(f"   [Row {idx+1}] Updating existing standard Contact ID {existing_contact.id}")
                        if l_name != "absent" and l_name:
                            existing_contact.extracted_name = l_name
                        if l_email != "absent" and l_email:
                            existing_contact.email = l_email
                        if l_arn != "absent" and l_arn:
                            existing_contact.arn = l_arn
                        db.add(existing_contact)
                    elif existing_bulk:
                        print(f"   [Row {idx+1}] Updating existing bulk Contact ID {existing_bulk.id}")
                        if l_name != "absent" and l_name:
                            existing_bulk.extracted_name = l_name
                        if l_email != "absent" and l_email:
                            existing_bulk.email = l_email
                        if l_arn != "absent" and l_arn:
                            existing_bulk.arn = l_arn
                        existing_bulk.status = "pending"
                        db.add(existing_bulk)
                    else:
                        # Save new bulk contact
                        bulk_data = {
                            "user_id": session.user_id,
                            "session_id": msg.session_id,
                            "wa_jid": msg.sender_jid,
                            "group_jid": msg.group_jid,
                            "extracted_name": l_name if l_name != "absent" else None,
                            "mobile": l_mobile if l_mobile != "absent" else None,
                            "email": l_email if l_email != "absent" else None,
                            "arn": l_arn if l_arn != "absent" else None,
                            "confidence": extracted.get('confidence', 0.5),
                            "lead_score": extracted.get('lead_score', 'Cold'),
                            "source_message": msg.text[:500] if msg.text and msg.text not in ["[image]", "[media]"] else "[bulk image screenshot]"
                        }
                        bulk_contact = BulkContact(**bulk_data)
                        db.add(bulk_contact)
                        added_bulk_count += 1
                        
                        # Add new mobile/email to session lists in-memory so subsequent entries don't duplicate
                        if l_mobile != "absent" and l_mobile:
                            session_bulk_contacts.append(bulk_contact)
                
                db.commit()
                print(f"✅ Processed bulk extraction. Added {added_bulk_count} new bulk leads.")
                
                # Broadcast WebSocket update
                try:
                    from core.ws import manager
                    await manager.broadcast({
                        "event": "bulk_lead_updated",
                        "data": {
                            "action": "created",
                            "session": msg.session_id,
                            "count": added_bulk_count
                        }
                    })
                except Exception as ws_err:
                    print(f"⚠️ Broadcast error: {ws_err}")
                return
            
            name = extracted.get('name', 'absent') if allow_name else 'absent'
            mobile = extracted.get('mobile', 'absent') if allow_mobile else 'absent'
            email = extracted.get('email', 'absent') if allow_email else 'absent'
            arn = extracted.get('arn', 'absent') if allow_arn else 'absent'
            
            print(f"📊 Extracted from THIS message - Name: {name}, Mobile: {mobile}, Email: {email}, ARN: {arn}")
            
            # 4. Validate and Sanitize extracted data
            # Rule 1: A valid lead MUST contain contact details (either mobile OR email).
            # If both are absent, we immediately skip/reject it.
            has_contact_info = False
            
            if mobile != "absent" and mobile and len(str(mobile)) >= 8:
                has_contact_info = True
            if email != "absent" and email and "@" in str(email):
                has_contact_info = True
            
            if not has_contact_info:
                print(f"⏭️ No contact (mobile) or email (mail) in this message. Skipping as it is not a valid lead.")
                return

            # Rule 2: Programmatically sanitize and reject irrelevant or generic names.
            if name != "absent" and name:
                name_lower = str(name).lower().strip()
                name_blacklist = [
                    "dear students", "dear all", "dear student", "dear candidate", "dear parents",
                    "reporting details", "special pep", "coding test", "announcement", "notice",
                    "sleeping", "busy", "working", "driving", "available", "hello", "hi", "hey",
                    "sir", "madam", "admin", "coordinator", "teacher", "host", "moderator",
                    "whatsapp", "message", "incoming", "outgoing", "class", "session", "dashboard",
                    "group", "team", "regards"
                ]
                
                is_invalid = False
                for term in name_blacklist:
                    if term == name_lower or (len(term) > 4 and term in name_lower):
                        is_invalid = True
                        break
                
                # Check formatting: name shouldn't be too long or too short, or contain system characters
                if is_invalid or len(name) > 40 or len(name) < 2:
                    print(f"⚠️ Rejecting irrelevant/invalid name: '{name}'. Resetting to 'absent'")
                    name = "absent"

            
            # 5. CRITICAL FIX: Check for EXACT duplicate based on mobile OR email using normalized mobile
            is_exact_duplicate = False
            mobile_norm = normalize_mobile(mobile) if mobile != "absent" else ""
            
            session_contacts_all = db.exec(select(Contact).where(Contact.session_id == msg.session_id)).all()
            
            if mobile_norm:
                existing_by_mobile = next((c for c in session_contacts_all if normalize_mobile(c.mobile) == mobile_norm), None)
                if existing_by_mobile:
                    is_exact_duplicate = True
                    print(f"⚠️ EXACT DUPLICATE: Mobile {mobile} already exists in this session (Contact: {existing_by_mobile.extracted_name})")
            
            if not is_exact_duplicate and email != "absent" and email:
                existing_by_email = next((c for c in session_contacts_all if c.email == email), None)
                if existing_by_email:
                    is_exact_duplicate = True
                    print(f"⚠️ EXACT DUPLICATE: Email {email} already exists in this session (Contact: {existing_by_email.extracted_name})")
            
            # If exact duplicate, skip (don't update, don't create new)
            if is_exact_duplicate:
                print(f"⏭️ Skipping - This contact already exists in session {msg.session_id}")
                return
            
            # 6. ALWAYS CREATE A NEW LEAD for each message with valid data
            # Even if same sender, each message represents a potential different person
            contact_data = {
                "user_id": session.user_id,
                "session_id": msg.session_id,
                "wa_jid": msg.sender_jid,
                "group_jid": msg.group_jid,
                "extracted_name": name if name != "absent" else None,
                "mobile": mobile if mobile != "absent" else None,
                "email": email if email != "absent" else None,
                "arn": arn if arn != "absent" else None,
                "company": extracted.get('company', None) if extracted.get('company') != 'absent' else None,
                "confidence": extracted.get('confidence', 0.5),
                "lead_score": extracted.get('lead_score', 'Cold'),
                "source_message": msg.text[:500] if msg.text and msg.text not in ["[image]", "[media]"] else "[media message]",
                "source_type": "image" if image_bytes else "text"
            }
            
            print(f"\n💾 Creating NEW lead record:")
            print(f"   Name: {contact_data['extracted_name']}")
            print(f"   Mobile: {contact_data['mobile']}")
            print(f"   Email: {contact_data['email']}")
            print(f"   ARN: {contact_data['arn']}")
            print(f"   Source: {contact_data['source_message'][:100]}...")
            print(f"   Sender: {msg.sender_name}")
            print(f"   Session: {msg.session_id}\n")
            
            contact = Contact(**contact_data)
            db.add(contact)
            db.commit()
            db.refresh(contact)
            
            print(f"✅ NEW lead saved successfully with ID: {contact.id}")
            
            # 7. Broadcast update
            try:
                from core.ws import manager
                await manager.broadcast({
                    "event": "lead_updated", 
                    "data": {
                        "id": contact.id,
                        "name": contact_data['extracted_name'],
                        "mobile": contact_data['mobile'],
                        "email": contact_data['email'],
                        "arn": contact_data['arn'],
                        "score": contact.lead_score,
                        "session": msg.session_id,
                        "action": "created",
                        "source_message": contact_data['source_message'][:100]
                    }
                })
                print(f"📡 Broadcast sent for new lead")
            except Exception as e:
                print(f"⚠️ Broadcast error: {e}")
                
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        import traceback
        traceback.print_exc()

@router.post("/whatsapp")
async def handle_whatsapp_message(msg: WhatsAppMessage, background_tasks: BackgroundTasks):
    print(f"\n📨 Webhook received:")
    print(f"   Session: {msg.session_id}")
    print(f"   Sender: {msg.sender_name}")
    print(f"   JID: {msg.sender_jid}")
    print(f"   Text: {msg.text}")
    
    # Skip empty messages
    if not msg.text and not msg.image_base64:
        print("⚠️ Empty message received, skipping")
        return {"status": "skipped", "message": "Empty message"}
    
    # Skip very short messages that likely don't contain contact info
    if msg.text and len(msg.text.strip()) < 10 and not msg.image_base64:
        print(f"⚠️ Message too short ({len(msg.text)} chars), might not contain contact info")
        # Still process but log warning
    
    image_bytes = None
    if msg.image_base64:
        try:
            # Handle both data URL and raw base64
            if ',' in msg.image_base64:
                msg.image_base64 = msg.image_base64.split(',')[1]
            image_bytes = base64.b64decode(msg.image_base64)
            print(f"🖼️ Image received: {len(image_bytes)} bytes")
        except Exception as e:
            print(f"❌ Image decode error: {e}")

    # Process in background
    background_tasks.add_task(process_lead_background, msg, image_bytes)
    
    return {"status": "accepted", "message": "Processing started"}


# Optional: Endpoint to get all leads for debugging
@router.get("/leads/{session_id}")
async def get_session_leads(session_id: str, db: Session = Depends(get_session)):
    """Debug endpoint to see all leads in a session"""
    leads = db.exec(select(Contact).where(Contact.session_id == session_id).order_by(Contact.created_at.desc())).all()
    
    return {
        "session_id": session_id,
        "total_leads": len(leads),
        "leads": [
            {
                "id": lead.id,
                "name": lead.extracted_name,
                "mobile": lead.mobile,
                "email": lead.email,
                "source_message": lead.source_message[:100] if lead.source_message else None,
                "created_at": lead.created_at.isoformat() + "Z" if lead.created_at else None,
                "sender_jid": lead.wa_jid
            }
            for lead in leads
        ]
    }