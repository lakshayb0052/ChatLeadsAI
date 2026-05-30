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
        orm_mode = True

@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
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
        raise HTTPException(
            status_code=400,
            detail=f"Agent with LG Code '{lg_code_clean}' already exists in your workspace."
        )
        
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
        existing_contacts = db.exec(
            select(Contact)
            .where(Contact.user_id == current_user.id)
        ).all()
        for c in existing_contacts:
            if c.lg_code and c.lg_code.strip().upper() == lg_code_clean.upper():
                c.executive_name = db_agent.executive_name
                c.executive_code = db_agent.executive_code
                c.agent_city = db_agent.city
                c.agent_place = db_agent.place
                c.agent_venue = db_agent.venue
                db.add(c)
        db.commit()
    except Exception as e:
        print("Agent creation sweep skipped:", e)
        
    return db_agent

@router.get("/", response_model=List[AgentResponse])
def get_agents(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Standard admins see only their own agents. Superadmins see all.
    if current_user.role == "superadmin":
        statement = select(Agent).order_by(Agent.lg_code)
    else:
        statement = select(Agent).where(Agent.user_id == current_user.id).order_by(Agent.lg_code)
        
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
