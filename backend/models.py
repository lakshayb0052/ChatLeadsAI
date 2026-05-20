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
    session_id: Optional[str] = None
    extracted_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    confidence: float = 0.0
    source_message: Optional[str] = None
    source_type: str = "whatsapp" # whatsapp, image, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    lead_score: Optional[str] = None  # Hot, Warm, Cold
