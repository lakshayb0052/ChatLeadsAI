from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from database import get_session, engine
from models import Contact, WhatsAppSession
from services.extractor import extractor
from pydantic import BaseModel
from typing import Optional, List
import re
from collections import defaultdict
import asyncio
from datetime import datetime
import base64

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
            
            name = extracted.get('name', 'absent')
            mobile = extracted.get('mobile', 'absent')
            email = extracted.get('email', 'absent')
            
            print(f"📊 Extracted from THIS message - Name: {name}, Mobile: {mobile}, Email: {email}")
            
            # 4. Validate extracted data
            has_valid_data = False
            
            if name != "absent" and name and len(str(name)) > 1:
                has_valid_data = True
            if mobile != "absent" and mobile and len(str(mobile)) >= 10:
                has_valid_data = True
            if email != "absent" and email and "@" in str(email):
                has_valid_data = True
            
            if not has_valid_data:
                print(f"⏭️ No valid lead data in this message, skipping")
                return
            
            # 5. CRITICAL FIX: Check for EXACT duplicate based on mobile OR email
            # Create NEW lead even if same sender, unless mobile/email exactly matches an existing lead
            is_exact_duplicate = False
            
            if mobile != "absent" and mobile:
                # Check if this exact mobile already exists in this session
                existing_by_mobile = db.exec(select(Contact).where(
                    Contact.session_id == msg.session_id,
                    Contact.mobile == mobile
                )).first()
                if existing_by_mobile:
                    is_exact_duplicate = True
                    print(f"⚠️ EXACT DUPLICATE: Mobile {mobile} already exists in this session (Contact: {existing_by_mobile.extracted_name})")
            
            if not is_exact_duplicate and email != "absent" and email:
                # Check if this exact email already exists in this session
                existing_by_email = db.exec(select(Contact).where(
                    Contact.session_id == msg.session_id,
                    Contact.email == email
                )).first()
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
                "created_at": lead.created_at.isoformat() if lead.created_at else None,
                "sender_jid": lead.wa_jid
            }
            for lead in leads
        ]
    }