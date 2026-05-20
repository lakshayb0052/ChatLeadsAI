from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from database import get_session
from models import User
from core.auth import authenticate_user, create_access_token, get_password_hash
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = "User"
    company_name: Optional[str] = None
    max_sessions: Optional[int] = 5

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    display_name: str
    email: str
    company_name: Optional[str] = None
    max_sessions: int

class LoginRequest(BaseModel):
    email: str
    password: str
    source: Optional[str] = None

@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_session)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        display_name=user_data.display_name or "User",
        role="user",
        company_name=user_data.company_name,
        max_sessions=user_data.max_sessions or 5
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

def process_login(email: str, password: str, source: Optional[str], db: Session):
    user = authenticate_user(db, email, password)
    if not user:
        # Check if they entered superadmin email to return the precise "No superadmin exists!" error when using wrong password on console flow
        if email.lower() == "admin@chatleads.ai":
            if source != "console":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No superadmin exists!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Enforce Super Admin Source Restrictions
    if user.role == "superadmin":
        if source != "console":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No superadmin exists!"
            )
    else:
        # Regular user trying to access Super Admin exclusive console flow
        if source == "console":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This console is restricted to Super Admins."
            )
            
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "display_name": user.display_name,
        "email": user.email,
        "company_name": user.company_name,
        "max_sessions": user.max_sessions
    }

@router.post("/login", response_model=TokenResponse)
def login(
    source: Optional[str] = Query(None),
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session)
):
    return process_login(form_data.username, form_data.password, source, db)

@router.post("/login-json", response_model=TokenResponse)
def login_json(
    req: LoginRequest,
    db: Session = Depends(get_session)
):
    return process_login(req.email, req.password, req.source, db)
