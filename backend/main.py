from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime
import json
import os
import sys



from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlmodel import Session
from jose import jwt, JWTError
from datetime import datetime
from typing import Optional

from database import get_db, create_db_and_tables, settings
from models import (
    Conversation,
    Message,
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
    TaskToolInput
)

from schemas import (
    Task,
    TaskCreate,
    TaskUpdate
)

# Import the new AI-powered ChatHandler
from chat_handler import ChatHandler

from auth import (
    get_current_user_from_token,
    verify_password,
    get_password_hash,
    create_access_token
)
from crud import get_conversation, delete_conversation, update_conversation_title

# Import Phase III simplified auth router (works without Phase II dependency)
from auth_router_simple import router as auth_router


# Security
security = HTTPBearer()

# CORS origins - configure for your deployment
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://yourdomain.com",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - runs on startup and shutdown."""
    # Startup: Create database tables
    create_db_and_tables()
    yield
    # Shutdown: Cleanup if needed
    pass


app = FastAPI(
    title="Todo AI Chatbot API - Phase III",
    description="AI-powered task management chat interface",
    version="3.0.0",
    lifespan=lifespan
)

# Include Phase III auth router to maintain compatibility with Phase II credentials
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication dependencies
import logging

logger = logging.getLogger(__name__)

# ... (rest of the imports)

# ... (previous code)

# Authentication dependencies
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """
    Get the current user ID from the JWT token.
    """
    token = credentials.credentials
    logger.info(f"Received token: {token[:30]}...") # Log the beginning of the token

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id_str = payload.get("sub")
        if user_id_str is None:
            logger.error("Invalid token: missing user ID (sub)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        logger.info(f"Successfully decoded token for user_id: {user_id_str}")
        return int(user_id_str)
    except jwt.ExpiredSignatureError:
        logger.error("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except JWTError as e:
        logger.error(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Todo AI Chatbot API - Phase III",
        "version": "3.0.0"
    }


@app.get("/api/health")
async def api_health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/health")
async def health_check():
    """Health check endpoint (alternative path)."""
    return {"status": "healthy"}


# Chat endpoints

@app.post("/api/{user_id:int}/chat", response_model=ChatResponse)
async def chat(
    user_id: int,  # Path parameter as per Phase 3 spec
    request: ChatRequest,
    auth_user_id: int = Depends(get_current_user_id),  # Verified from JWT
    db: Session = Depends(get_db)
):
    """
    Main chat endpoint for AI-powered task management.

    This endpoint implements stateless chat:
    1. Receives a user message
    2. Processes it with the AI agent (using OpenAI Agents SDK)
    3. Calls MCP tools as needed
    4. Returns the AI response

    Path parameter: user_id (must match authenticated user from JWT)
    This is per Phase 3 specification.

    Args:
        user_id: User ID from URL path (must match auth_user_id)
        request: Chat request with message and optional conversation_id
        db: Database session

    Returns:
        ChatResponse with AI response, conversation_id, and message_id

    Raises:
        HTTPException: If user_id doesn't match authenticated user
    """
    # CRITICAL: Verify path parameter user_id matches authenticated user
    # This ensures users can only access their own data
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    handler = ChatHandler(db, user_id)

    try:
        response_content, conversation_id, message_id = await handler.process_message(
            message=request.message.strip(),
            conversation_id=request.conversation_id
        )

        # Parse tool info from message for response
        message = db.get(Message, message_id)
        tool_calls = []
        if message and message.tool_calls:
            try:
                tool_calls = json.loads(message.tool_calls)
            except (json.JSONDecodeError, TypeError):
                tool_calls = []

        return ChatResponse(
            response=response_content,
            conversation_id=conversation_id,
            message_id=message_id,
            tool_calls=tool_calls
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


# User-specific task endpoints (path parameter version for frontend)

@app.get("/api/{user_id:int}/tasks", response_model=List[Task])
async def get_user_tasks(
    user_id: int,
    status: str = Query("all", pattern="^(all|pending|completed)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List tasks for a specific user.
    User must be authenticated and can only access their own tasks.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    from crud import get_tasks
    filter_completed = None
    if status == "pending":
        filter_completed = False
    elif status == "completed":
        filter_completed = True

    tasks = get_tasks(db, user_id, skip=skip, limit=limit, filter_completed=filter_completed)

    return tasks


@app.post("/api/{user_id:int}/tasks", response_model=Task)
async def create_user_task(
    user_id: int,
    task_request: TaskCreate,
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new task for a specific user.
    User must be authenticated and can only create tasks for themselves.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    if not task_request.title or len(task_request.title) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required and must be 1-255 characters"
        )

    # Validate priority
    valid_priorities = ["low", "medium", "high"]
    priority = task_request.priority or "medium"
    if priority not in valid_priorities:
        priority = "medium"

    from crud import create_task

    task_input = TaskToolInput(
        title=task_request.title,
        description=task_request.description if hasattr(task_request, 'description') else "",
        completed=False,
        priority=priority
    )

    task = create_task(db, task_input, user_id)

    return task


@app.put("/api/{user_id:int}/tasks/{task_id}", response_model=Task)
async def update_user_task(
    user_id: int,
    task_id: int,
    task_request: TaskUpdate,
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update a task for a specific user.
    User must be authenticated and can only update their own tasks.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    from crud import update_task, get_task

    # Verify task exists and belongs to user
    task = get_task(db, task_id, user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Convert TaskUpdateRequest to TaskToolInput
    update_data = task_request.model_dump(exclude_unset=True)
    task_input = TaskToolInput(**update_data)


    task = update_task(db, task_id, task_input, user_id)

    return task


@app.delete("/api/{user_id:int}/tasks/{task_id}")
async def delete_user_task(
    user_id: int,
    task_id: int,
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a task for a specific user.
    User must be authenticated and can only delete their own tasks.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    from crud import delete_task, get_task

    # Verify task exists and belongs to user
    task = get_task(db, task_id, user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    delete_task(db, task_id)

    return {"status": "deleted", "task_id": task_id}


@app.patch("/api/{user_id:int}/tasks/{task_id}/complete", response_model=Task)
async def toggle_user_task_complete(
    user_id: int,
    task_id: int,
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Toggle completion status of a task for a specific user.
    User must be authenticated and can only toggle their own tasks.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    from crud import get_task
    from sqlmodel import select

    # Verify task exists and belongs to user
    task = get_task(db, task_id, user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Toggle completion
    task.completed = not task.completed
    db.add(task)
    db.commit()
    db.refresh(task)

    return task




# Frontend-compatible conversation endpoints (path parameter matching frontend expectations)

@app.get("/api/{user_id:int}/conversations", response_model=List[ConversationResponse])
async def list_conversations_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List all conversations for the authenticated user (path parameter version).
    This endpoint matches frontend expectations: /api/{user_id}/conversations

    The user_id path parameter must match the authenticated user.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    handler = ChatHandler(db, auth_user_id)
    conversations = handler.get_conversations(skip=skip, limit=limit)

    result = []
    for conv in conversations:
        messages = handler.get_conversation_messages(conv.id)
        result.append(ConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=len(messages)
        ))

    return result


@app.get("/api/{user_id:int}/conversations/{conversation_id}", response_model=List[MessageResponse])
async def get_conversation_messages_by_user(
    user_id: int,
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all messages in a conversation (path parameter version).
    This endpoint matches frontend expectations: /api/{user_id}/conversations/{id}

    The user_id path parameter must match the authenticated user.
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    handler = ChatHandler(db, auth_user_id)
    conversation = get_conversation(db, conversation_id, auth_user_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    messages = handler.get_conversation_messages(conversation_id)
    messages = messages[skip:skip + limit]

    return [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            user_id=msg.user_id,
            role=msg.role,
            content=msg.content,
            tool_calls=msg.tool_calls if msg.tool_calls else None,
            tool_results=msg.tool_results if msg.tool_results else None,
            created_at=msg.created_at
        )
        for msg in messages
    ]


@app.delete("/api/{user_id:int}/conversations/{conversation_id}")
async def delete_conversation_by_user(
    user_id: int,
    conversation_id: int,
    auth_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its messages (path parameter version).
    """
    # Verify the path parameter user_id matches authenticated user
    if user_id != auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: you can only access your own data"
        )

    success = delete_conversation(db, conversation_id, auth_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return {"message": "Conversation deleted successfully"}


# ChatKit session endpoint
class ChatKitSessionResponse(BaseModel):
    """Response schema for ChatKit session creation."""
    client_token: str
    user_id: int


@app.post("/api/chatkit/session", response_model=ChatKitSessionResponse)
async def create_chatkit_session(
    user_id: int = Depends(get_current_user_id)
):
    """
    Create a ChatKit session for the authenticated user.

    ChatKit is OpenAI's real-time chat protocol that enables
    seamless voice and text conversations with the AI.

    Args:
        user_id: Authenticated user ID from JWT

    Returns:
        ChatKitSessionResponse with client_token and user_id

    Note:
        This endpoint creates a mock client_token for now.
        In production, integrate with actual ChatKit SDK.
    """
    try:
        # For now, create a mock session token
        # In production, this would call OpenAI ChatKit API
        import uuid
        import logging
        logger = logging.getLogger(__name__)
        
        session_token = f"chatkit_token_{uuid.uuid4()}_{user_id}"

        return ChatKitSessionResponse(
            client_token=session_token,
            user_id=user_id
        )

    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"ChatKit session creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create ChatKit session: {str(e)}"
        )

