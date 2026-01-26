from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# Shared properties for a task
class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = 'medium'
    completed: Optional[bool] = False

# Schema for creating a task (for POST requests)
# Title is the only required field for creation
class TaskCreate(TaskBase):
    title: str

# Schema for updating a task (for PUT/PATCH requests)
# All fields are optional
class TaskUpdate(TaskBase):
    pass

# The main schema for representing a task (for GET responses)
# This will be created from the database model
class Task(TaskBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # This is the correct Pydantic v2 setting
    model_config = ConfigDict(from_attributes=True)