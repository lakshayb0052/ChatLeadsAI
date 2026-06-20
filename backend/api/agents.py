from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from database import get_session
from models import Agent, User
from core.auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])

class AgentCreate(BaseModel):
    lg_code: str
    executive_name: str
    executive_code: str
    city: str
    place: str
    venue: str

class AgentResponse(BaseModel):
    id: int
    lg_code: str
    executive_name: str
    executive_code: str
    city: str
    place: str
    venue: str
    user_id: int

    class Config:
        from_attributes = True

@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # To keep lg_code clean, we strip it
    lg_code_clean = agent_in.lg_code.strip()
    
    # Check if this lg_code already exists for this admin
    existing = db.exec(
        select(Agent)
        .where(Agent.lg_code == lg_code_clean)
        .where(Agent.user_id == current_user.id)
    ).first()
    
    if existing:
        # Update existing agent's details
        existing.executive_name = agent_in.executive_name.strip()
        existing.executive_code = agent_in.executive_code.strip()
        existing.city = agent_in.city.strip()
        existing.place = agent_in.place.strip()
        existing.venue = agent_in.venue.strip()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        db_agent = existing
    else:
        # Create a new agent entry
        db_agent = Agent(
            user_id=current_user.id,
            lg_code=lg_code_clean,
            executive_name=agent_in.executive_name.strip(),
            executive_code=agent_in.executive_code.strip(),
            city=agent_in.city.strip(),
            place=agent_in.place.strip(),
            venue=agent_in.venue.strip()
        )
        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)
    
    # Automatically sweep and populate existing contacts matching this lg_code
    try:
        from models import Contact
        from core.ws import manager
        
        # Superadmins sweep all contacts; standard users sweep their own contacts
        statement = select(Contact)
        if current_user.role != "superadmin":
            statement = statement.where(Contact.user_id == current_user.id)
            
        existing_contacts = db.exec(statement).all()
        swept = False
        for c in existing_contacts:
            if c.lg_code and c.lg_code.strip().upper() == lg_code_clean.upper():
                c.executive_name = db_agent.executive_name
                c.executive_code = db_agent.executive_code
                c.agent_city = db_agent.city
                c.agent_place = db_agent.place
                c.agent_venue = db_agent.venue
                db.add(c)
                swept = True
                
        if swept:
            db.commit()
            await manager.broadcast({
                "event": "lead_updated",
                "data": {
                    "action": "bulk_update"
                }
            })
    except Exception as e:
        print("Agent creation sweep skipped:", e)
        
    return db_agent

@router.get("/", response_model=List[AgentResponse])
def get_agents(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Retrieve all agents for all users to ensure they are globally visible.
    statement = select(Agent).order_by(Agent.lg_code)
    return db.exec(statement).all()

@router.delete("/{agent_id}")
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    if current_user.role != "superadmin" and agent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this agent entry")
        
    db.delete(agent)
    db.commit()
    return {"status": "success"}
