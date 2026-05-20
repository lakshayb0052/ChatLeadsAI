from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import User
from core.auth import get_current_user, get_password_hash
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/users", tags=["users"])

class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    role: str
    company_name: Optional[str]
    max_sessions: int
    is_active: bool

class CompanyUserCreate(BaseModel):
    display_name: str
    email: str
    password: str
    company_name: str
    max_sessions: int = 5

@router.get("/", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    # Strictly authorize Super Admin role
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Super Admins can manage companies."
        )
    
    # Select all users who are not superadmins
    statement = select(User).where(User.role == "user").order_by(User.created_at.desc())
    users = db.exec(statement).all()
    return users

@router.post("/create", response_model=UserResponse)
def create_company_user(
    payload: CompanyUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Super Admins can manage companies."
        )
        
    # Check if user already exists
    existing = db.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        display_name=payload.display_name,
        role="user",
        company_name=payload.company_name,
        max_sessions=payload.max_sessions
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/{user_id}")
def delete_company_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Super Admins can manage companies."
        )
        
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company user not found."
        )
        
    if target_user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete Super Admin account."
        )
        
    db.delete(target_user)
    db.commit()
    return {"status": "success", "message": "Company user successfully removed."}
