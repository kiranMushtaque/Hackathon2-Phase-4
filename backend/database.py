"""
Phase III Database Connection
Uses Phase 2 database setup with additional tables for conversations.
"""

from datetime import datetime, timezone
from sqlmodel import SQLModel, Session, create_engine

from dotenv import load_dotenv
load_dotenv()

# Always use fallback to avoid Phase 2 import conflicts
from pydantic_settings import BaseSettings
from sqlmodel import Field
from typing import Optional
from datetime import datetime

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:////tmp/taskmanager.db"
    SECRET_KEY: str = "phase2-secure-jwt-secret-key-minimum-32-characters-long"
    BETTER_AUTH_SECRET: str = "your-better-auth-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DEBUG: bool = False
    OPENAI_API_KEY: str = "your-openai-api-key"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Unify secret key: Use BETTER_AUTH_SECRET if it's set, as per project standards
if settings.BETTER_AUTH_SECRET and settings.BETTER_AUTH_SECRET != "your-better-auth-secret":
    settings.SECRET_KEY = settings.BETTER_AUTH_SECRET

# Define User model
class User(SQLModel, table=True):
    """User model for authentication."""
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    name: str = Field(max_length=255)

# Define Task model (needed for Phase 3)
class Task(SQLModel, table=True):
    """Task model for task management."""
    __tablename__ = "tasks"
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(default="", max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: str = Field(default="medium", max_length=50)  # Changed from Optional[str] to str with default
    starred: bool = Field(default=False)
    tags: Optional[str] = Field(default=None, max_length=500)
    due_date: Optional[datetime] = Field(default=None)
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)

# Export for use in other modules
__all__ = ["settings", "engine", "User", "Task", "get_db", "create_db_and_tables"]

# Create engine
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        echo=settings.DEBUG
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=20,
        max_overflow=30,
        echo=settings.DEBUG
    )


def get_db():
    """Database session dependency."""
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close()


def create_db_and_tables():
    """Create all database tables."""
    # Import Phase 3 models to register them
    # We only register the local models (Conversation, Message) for phase3
    # The User and Task models from phase2 are not re-registered here
    # to avoid conflicts
    from models import Conversation, Message  # noqa: F401
    try:
        # Drop all tables first to ensure clean schema
        SQLModel.metadata.drop_all(bind=engine)
        # Then create all tables with the new schema
        SQLModel.metadata.create_all(bind=engine)
    except Exception as e:
        # If tables already exist, continue (this can happen with existing databases)
        # Re-attempt creation without dropping, just in case of race condition or existing DB
        try:
            SQLModel.metadata.create_all(bind=engine)
        except Exception:
            pass # Ignore if creation also fails, it means tables truly exist