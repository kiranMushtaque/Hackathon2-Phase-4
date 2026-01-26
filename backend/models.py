"""
Phase III Database Models
Extends Phase II Task model with Conversation and Message for AI chat functionality.

IMPORTANT: Do NOT re-import User or Task from Phase 2.
These models are already defined in Phase 2 and registered in the database.
Only import them when needed in individual modules (crud.py, main.py, etc).
"""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, DateTime, Text
from sqlalchemy.sql import func


class Conversation(SQLModel, table=True):
    """
    Conversation model for AI chat sessions.
    Each conversation belongs to a user and contains multiple messages.
    """
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    user_id: int = Field(index=True, foreign_key="users.id")
    title: str = Field(default="New Conversation", max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), default=func.now()))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), default=func.now(), onupdate=func.now()))


class Message(SQLModel, table=True):
    """
    Message model for chat messages within a conversation.
    Messages can be from user, assistant (AI), or system.
    Tool calls and results are stored as JSON strings.
    """
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    conversation_id: int = Field(index=True, foreign_key="conversations.id")
    user_id: int = Field(index=True)
    role: str = Field(default="user", max_length=20)  # "user", "assistant", "system", "tool"
    content: str = Field(sa_column=Column(Text))
    tool_calls: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON array of tool calls
    tool_results: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON array of tool results
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), default=func.now()))


# TaskToolInput schema for MCP tools
class TaskToolInput(SQLModel):
    """Input schema for task operations from MCP."""
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = "medium"  # Default to medium priority
    starred: Optional[bool] = None
    tags: Optional[List[str]] = None
    due_date: Optional[str] = None
    task_id: Optional[int] = None
    filter_completed: Optional[bool] = None


# Pydantic schemas for API requests/responses
class ChatRequest(SQLModel):
    """Schema for chat API request."""
    conversation_id: Optional[int] = None
    message: str


class ChatResponse(SQLModel):
    """Schema for chat API response."""
    conversation_id: int
    message_id: int
    response: str
    tool_calls: Optional[List[dict]] = None


class ConversationResponse(SQLModel):
    """Schema for conversation response."""
    id: int
    user_id: int
    title: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    message_count: int = 0

    class Config:
        from_attributes = True


class MessageResponse(SQLModel):
    """Schema for message response."""
    id: int
    conversation_id: int
    user_id: int
    role: str
    content: str
    tool_calls: Optional[List[dict]] = None
    tool_results: Optional[List[dict]] = None
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
