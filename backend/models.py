from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    display_name: str = Field(default="User")
    role: str = Field(default="user")  # "superadmin" or "user"
    company_name: Optional[str] = Field(default=None)
    max_sessions: int = Field(default=5)  # quota limit of whatsapp sessions
    is_active: bool = True
    allow_bulk: bool = Field(default=False)
    allow_name: bool = Field(default=True)
    allow_mobile: bool = Field(default=True)
    allow_email: bool = Field(default=True)
    allow_arn: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WhatsAppSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    session_id: str = Field(index=True)  # Baileys session ID
    status: str = "disconnected"  # connected, disconnected, linking
    qr_code: Optional[str] = None
    last_seen: datetime = Field(default_factory=datetime.utcnow)

class Contact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    wa_jid: str = Field(index=True)
    group_jid: Optional[str] = None
    session_id: Optional[str] = Field(default=None, index=True)
    extracted_name: Optional[str] = None
    mobile: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None, index=True)
    company: Optional[str] = None
    confidence: float = 0.0
    source_message: Optional[str] = None
    source_type: str = "whatsapp" # whatsapp, image, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    lead_score: Optional[str] = None  # Hot, Warm, Cold
    arn: Optional[str] = Field(default=None, index=True)

    # Excel Matched Fields
    creation_date_time: Optional[str] = Field(default=None, nullable=True)
    customer_type: Optional[str] = Field(default=None, nullable=True)
    state: Optional[str] = Field(default=None, nullable=True)
    pincode: Optional[str] = Field(default=None, nullable=True)
    lg_code: Optional[str] = Field(default=None, index=True, nullable=True)
    ipa_status: Optional[str] = Field(default=None, nullable=True)
    dropoff_reason: Optional[str] = Field(default=None, nullable=True)
    idcom_status: Optional[str] = Field(default=None, nullable=True)
    vkyc_status: Optional[str] = Field(default=None, nullable=True)
    vkyc_consent_date: Optional[str] = Field(default=None, nullable=True)
    vkyc_expiry_date: Optional[str] = Field(default=None, nullable=True)
    capture_link: Optional[str] = Field(default=None, nullable=True)
    final_decision: Optional[str] = Field(default=None, nullable=True)
    final_decision_date: Optional[str] = Field(default=None, nullable=True)
    current_stage: Optional[str] = Field(default=None, nullable=True)
    kyc_status: Optional[str] = Field(default=None, nullable=True)
    decline_type: Optional[str] = Field(default=None, nullable=True)
    product_des: Optional[str] = Field(default=None, nullable=True)
    kyc_success_nr: Optional[str] = Field(default=None, nullable=True)
    card_type: Optional[str] = Field(default=None, nullable=True)
    card_active_status: Optional[str] = Field(default=None, nullable=True)
    application_id: Optional[str] = Field(default=None, nullable=True)
    remarks: Optional[str] = Field(default=None, nullable=True)

    # Location & Agent Details (Populated from matched Agent code)
    executive_name: Optional[str] = Field(default=None, nullable=True)
    executive_code: Optional[str] = Field(default=None, nullable=True)
    agent_city: Optional[str] = Field(default=None, nullable=True)
    agent_place: Optional[str] = Field(default=None, nullable=True)
    agent_venue: Optional[str] = Field(default=None, nullable=True)

    # Tracking match
    excel_updated: bool = Field(default=False, nullable=True)
    excel_updated_at: Optional[datetime] = Field(default=None, nullable=True)


class Agent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    lg_code: str = Field(index=True)
    executive_name: str
    executive_code: str
    city: str
    place: str
    venue: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BulkContact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    session_id: Optional[str] = Field(default=None, index=True)
    wa_jid: str = Field(index=True)
    group_jid: Optional[str] = None
    extracted_name: Optional[str] = None
    mobile: Optional[str] = Field(default=None, index=True)
    email: Optional[str] = Field(default=None, index=True)
    arn: Optional[str] = Field(default=None, index=True)
    confidence: float = 0.0
    lead_score: Optional[str] = None
    source_message: Optional[str] = None
    status: str = Field(default="pending")  # pending, added
    created_at: datetime = Field(default_factory=datetime.utcnow)



