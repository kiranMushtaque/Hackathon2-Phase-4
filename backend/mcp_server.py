"""
Phase III MCP Server
Official MCP (Model Context Protocol) SDK implementation.

Exposes 5 task management tools for the AI agent:
1. add_task(title: str, description: str = None)
2. list_tasks(status: str = "all")
3. complete_task(tool_id: int)
4. delete_task(task_id: int)
5. update_task(task_id: int, title: str = None, description: str = None)

Each tool is user-specific and only accesses tasks for the authenticated user.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

# MCP SDK imports
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
    MCP_AVAILABLE = True
except ImportError:
    # Fallback for when MCP SDK is not installed
    MCP_AVAILABLE = False
    from typing import TypedDict

    class Tool(TypedDict):
        name: str
        description: str
        inputSchema: dict

    class TextContent(TypedDict):
        type: str
        text: str

# Database and model imports
from database import get_db
from crud import (
    create_task,
    get_tasks,
    update_task,
    delete_task,
    get_task
)
from models import TaskToolInput

logger = logging.getLogger(__name__)


# Initialize MCP server
app = Server("todo-mcp-server")


# Global context for user_id (set during request processing)
# This is a simple approach; in production, use proper context passing
_mcp_user_id: Optional[int] = None


def set_mcp_user_id(user_id: int):
    """Set the current user ID for MCP tool calls."""
    global _mcp_user_id
    _mcp_user_id = user_id


def get_mcp_user_id() -> Optional[int]:
    """Get the current user ID for MCP tool calls."""
    return _mcp_user_id


# MCP Tool Definitions
@app.list_tools()
async def list_tools() -> List[Tool]:
    """
    List available MCP tools for task management.

    Returns:
        List of Tool definitions with input schemas
    """
    return [
        Tool(
            name="add_task",
            description="Create a new task for the user. Use when the user wants to add a new todo item.",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Task title (required, 1-255 characters)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Task description (optional, max 1000 characters)"
                    }
                },
                "required": ["title"]
            }
        ),
        Tool(
            name="list_tasks",
            description="Retrieve tasks from the list. Use when user asks to see, show, or list tasks.",
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["all", "pending", "completed"],
                        "description": "Filter tasks by status (defaults to 'all')"
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="complete_task",
            description="Mark a task as complete. Use when user indicates a task is done.",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The task ID to mark as completed"
                    }
                },
                "required": ["task_id"]
            }
        ),
        Tool(
            name="delete_task",
            description="Remove a task from the list. Use when user wants to delete/remove/cancel a task.",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The task ID to delete"
                    }
                },
                "required": ["task_id"]
            }
        ),
        Tool(
            name="update_task",
            description="Modify task title or description. Use when user wants to change/update/rename a task.",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The task ID to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New task title (optional)"
                    },
                    "description": {
                        "type": "string",
                        "description": "New task description (optional)"
                    }
                },
                "required": ["task_id"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """
    Handle MCP tool calls from the AI agent.

    Args:
        name: Tool name to call
        arguments: Tool arguments as dictionary

    Returns:
        List of TextContent responses
    """
    # Get user_id from context
    user_id = get_mcp_user_id()
    if user_id is None:
        return [TextContent(
            type="text",
            text=json.dumps({
                "success": False,
                "error": "Authentication required. Please provide a valid JWT token."
            })
        )]

    # Create a new database session for this request
    generator = get_db()
    db = next(generator)

    try:
        if name == "add_task":
            return await handle_add_task(db, user_id, arguments)
        elif name == "list_tasks":
            return await handle_list_tasks(db, user_id, arguments)
        elif name == "complete_task":
            return await handle_complete_task(db, user_id, arguments)
        elif name == "delete_task":
            return await handle_delete_task(db, user_id, arguments)
        elif name == "update_task":
            return await handle_update_task(db, user_id, arguments)
        else:
            return [TextContent(
                type="text",
                text=json.dumps({
                    "success": False,
                    "error": f"Unknown tool: {name}"
                })
            )]
    except Exception as e:
        logger.error(f"Tool call error: {e}")
        return [TextContent(
            type="text",
            text=json.dumps({
                "success": False,
                "error": str(e)
            })
        )]
    finally:
        db.close()


async def handle_add_task(db, user_id: int, args: Dict[str, Any]) -> List[TextContent]:
    """Handle add_task tool call."""

    title = args.get("title")
    if not title:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "Title is required"})
        )]

    if len(title) > 255:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "Title must be 255 characters or less"})
        )]

    description = args.get("description")
    if description and len(description) > 1000:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "Description must be 1000 characters or less"})
        )]

    task_input = TaskToolInput(
        title=title,
        description=description,
        completed=False
    )

    task = create_task(db, task_input, user_id)

    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "task_id": task.id,
            "status": "created",
            "title": task.title
        })
    )]


async def handle_list_tasks(db, user_id: int, args: Dict[str, Any]) -> List[TextContent]:
    """Handle list_tasks tool call."""
    status_filter = args.get("status", "all")

    if status_filter == "pending":
        filter_completed = False
    elif status_filter == "completed":
        filter_completed = True
    else:
        filter_completed = None

    tasks = get_tasks(db, user_id, skip=0, limit=100, filter_completed=filter_completed)

    task_list = []
    for task in tasks:
        task_list.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed
        })

    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "tasks": task_list,
            "count": len(task_list)
        })
    )]


async def handle_complete_task(db, user_id: int, args: Dict[str, Any]) -> List[TextContent]:
    """Handle complete_task tool call."""

    task_id = args.get("task_id")
    if task_id is None:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "task_id is required"})
        )]

    existing_task = get_task(db, task_id, user_id)
    if not existing_task:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": f"Task with ID {task_id} not found"})
        )]

    task_input = TaskToolInput(completed=True)
    task = update_task(db, task_id, task_input, user_id)

    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "task_id": task.id,
            "status": "completed",
            "title": task.title
        })
    )]


async def handle_delete_task(db, user_id: int, args: Dict[str, Any]) -> List[TextContent]:
    """Handle delete_task tool call."""
    task_id = args.get("task_id")
    if task_id is None:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "task_id is required"})
        )]

    existing_task = get_task(db, task_id, user_id)
    if not existing_task:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": f"Task with ID {task_id} not found"})
        )]

    task_title = existing_task.title
    success = delete_task(db, task_id, user_id)

    if not success:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": f"Failed to delete task {task_id}"})
        )]

    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "task_id": task_id,
            "status": "deleted",
            "title": task_title
        })
    )]


async def handle_update_task(db, user_id: int, args: Dict[str, Any]) -> List[TextContent]:
    """Handle update_task tool call."""

    task_id = args.get("task_id")
    if task_id is None:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "task_id is required"})
        )]

    existing_task = get_task(db, task_id, user_id)
    if not existing_task:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": f"Task with ID {task_id} not found"})
        )]

    title = args.get("title")
    if title and len(title) > 255:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "Title must be 255 characters or less"})
        )]

    description = args.get("description")
    if description and len(description) > 1000:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": "Description must be 1000 characters or less"})
        )]

    task_input = TaskToolInput(
        title=title,
        description=description
    )

    task = update_task(db, task_id, task_input, user_id)

    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "task_id": task.id,
            "status": "updated",
            "title": task.title
        })
    )]


def run_mcp_server():
    """
    Run the MCP server using stdio transport.
    This is the entry point for the MCP server.
    """
    logging.basicConfig(level=logging.INFO)

    async def main():
        async with stdio_server() as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options()
            )

    asyncio.run(main())


if __name__ == "__main__":
    run_mcp_server()
