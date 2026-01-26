"""
Phase III CRUD Operations
Handles database operations for conversations and messages.
Uses Phase 2 models for tasks.
"""

import json
from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select

# Import from database.py to avoid conflicts
from database import User, Task

# Import Phase 3 models
from models import Conversation, Message, TaskToolInput


# Task operations - direct implementation
def get_task(db: Session, task_id: int, user_id: int):
    """Get a specific task by ID for a user."""
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    return db.exec(statement).first()


def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100,
              filter_completed: Optional[bool] = None):
    """Get all tasks for a user with optional filtering."""
    statement = select(Task).where(Task.user_id == user_id)
    if filter_completed is not None:
        statement = statement.where(Task.completed == filter_completed)
    statement = statement.offset(skip).limit(limit)
    return db.exec(statement).all()


def create_task(db: Session, task_input: TaskToolInput, user_id: int):
    """Create a new task."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    task = Task(
        user_id=user_id,
        title=task_input.title,
        description=task_input.description,
        completed=task_input.completed or False,
        priority=task_input.priority,  # Use the priority directly since it has a default
        starred=task_input.starred or False,
        tags=task_input.tags,
        due_date=task_input.due_date,
        created_at=now,
        updated_at=now
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task_id: int, task_input: TaskToolInput, user_id: int):
    """Update an existing task."""
    task = get_task(db, task_id, user_id)
    if not task:
        return None

    if task_input.title is not None:
        task.title = task_input.title
    if task_input.description is not None:
        task.description = task_input.description
    if task_input.completed is not None:
        task.completed = task_input.completed
    if task_input.priority is not None:
        task.priority = task_input.priority
    if task_input.starred is not None:
        task.starred = task_input.starred
    if task_input.tags is not None:
        task.tags = task_input.tags
    if task_input.due_date is not None:
        task.due_date = task_input.due_date

    task.updated_at = datetime.now(timezone.utc)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, user_id: int) -> bool:
    """Delete a task."""
    task = get_task(db, task_id, user_id)
    if not task:
        return False

    db.delete(task)
    db.commit()
    return True


# Conversation CRUD operations
def create_conversation(db: Session, user_id: int, title: Optional[str] = None) -> Conversation:
    """Create a new conversation for a user."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    conversation = Conversation(
        user_id=user_id,
        title=title or "New Conversation",
        created_at=now,
        updated_at=now
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(db: Session, conversation_id: int, user_id: int) -> Optional[Conversation]:
    """Get a specific conversation by ID for a user."""
    statement = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    )
    return db.exec(statement).first()


def get_user_conversations(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50
) -> List[Conversation]:
    """Get all conversations for a user, ordered by most recent."""
    statement = select(Conversation).where(
        Conversation.user_id == user_id
    ).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit)
    return db.exec(statement).all()


def update_conversation_title(
    db: Session,
    conversation_id: int,
    user_id: int,
    title: str
) -> Optional[Conversation]:
    """Update conversation title."""
    conversation = get_conversation(db, conversation_id, user_id)
    if conversation:
        conversation.title = title
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    return conversation


def delete_conversation(db: Session, conversation_id: int, user_id: int) -> bool:
    """Delete a conversation and all its messages."""
    conversation = get_conversation(db, conversation_id, user_id)
    if conversation:
        db.delete(conversation)
        db.commit()
        return True
    return False


# Message CRUD operations
def create_message(
    db: Session,
    conversation_id: int,
    user_id: int,
    role: str,
    content: str,
    tool_calls: Optional[List[dict]] = None,
    tool_results: Optional[List[dict]] = None
) -> Message:
    """Create a new message in a conversation."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
        tool_calls=json.dumps(tool_calls) if tool_calls else None,
        tool_results=json.dumps(tool_results) if tool_results else None,
        created_at=now
    )
    db.add(message)

    # Update conversation's updated_at timestamp
    conversation = get_conversation(db, conversation_id, user_id)
    if conversation:
        conversation.updated_at = now
        db.add(conversation)

    db.commit()
    db.refresh(message)
    return message


def get_conversation_messages(
    db: Session,
    conversation_id: int,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Message]:
    """Get all messages in a conversation."""
    # First verify user has access to this conversation
    conversation = get_conversation(db, conversation_id, user_id)
    if not conversation:
        return []

    statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit)

    return db.exec(statement).all()


def get_user(db: Session, user_id: int):
    """Get a user by ID."""
    statement = select(User).where(User.id == user_id)
    return db.exec(statement).first()


def get_user_by_email(db: Session, email: str):
    """Get a user by email."""
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()
