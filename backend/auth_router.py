from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlmodel import Session, select
from typing import Optional
import os

# Create router
router = APIRouter()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration - using the same settings as Phase II
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class TokenResponse(BaseModel):
    token: str  # Changed to match frontend expectation
    token_type: str
    user: dict


# Import the models and database components directly from Phase II using relative imports
from database import get_db  # Use local database connection
from models import User as Phase2User  # Use local User model
from crud import get_user_by_email, get_user
from auth import verify_password, get_password_hash


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user against the database."""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user and return access token.
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(request.password)
    new_user = Phase2User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token (sub must be string per JWT spec)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  # Use local variable
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=access_token_expires
    )

    return {
        "token": access_token,  # Changed from "access_token" to "token" for frontend compatibility
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name
        }
    }


@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token.
    Verifies credentials against the database.
    """
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    # Create access token (sub must be string per JWT spec)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  # Use local variable
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "token": access_token,  # Changed from "access_token" to "token" for frontend compatibility
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }


# JWT verification dependency
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_current_user_from_token(token: str) -> int:
    """Get the current user from the JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id_str is None or token_type != "access":
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return int(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get the current user from the JWT token."""
    token = credentials.credentials
    user_id = get_current_user_from_token(token)

    # Verify that the user exists in the database
    user = db.get(Phase2User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user_id


@router.get("/me")
async def get_current_user_info(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user information based on the JWT token.
    """
    user = get_user(db, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name
    }


@router.post("/refresh")
async def refresh_token(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh access token.
    Returns a new access token for the authenticated user.
    """
    user = get_user(db, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  # Use local variable
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "token": access_token,  # Changed for frontend compatibility
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    """
    return {"message": "Logged out successfully"}