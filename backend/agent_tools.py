"""
Phase III Agent Tools - Google GenAI Function Declarations
Defines the tools for the Google GenAI AI agent using proper FunctionDeclaration format.
"""

from typing import Any, Dict, List

# Import the newer google-generativeai library directly
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool as GenAITool

def get_genai_task_management_tools() -> List[GenAITool]:
    """
    Creates and returns the task management tools in Google GenAI FunctionDeclaration format.

    Returns:
        List of GenAITool objects containing FunctionDeclarations for task management
    """
    # Define the add_task function
    add_task_func = FunctionDeclaration(
        name="add_task",
        description="Create a new task for the user. Use when the user wants to add a new todo item.",
        parameters={
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Task title (required, 1-255 characters)"
                },
                "description": {
                    "type": "string",
                    "description": "Task description (optional, max 1000 characters)"
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "Task priority (defaults to 'medium' if not specified)"
                }
            },
            "required": ["title"]
        }
    )

    # Define the list_tasks function
    list_tasks_func = FunctionDeclaration(
        name="list_tasks",
        description="Retrieve tasks from the list. Use when user asks to see, show, or list tasks.",
        parameters={
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
    )

    # Define the complete_task function
    complete_task_func = FunctionDeclaration(
        name="complete_task",
        description="Mark a task as complete. Use when user indicates a task is done.",
        parameters={
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "integer",
                    "description": "The task ID to mark as completed"
                }
            },
            "required": ["task_id"]
        }
    )

    # Define the delete_task function
    delete_task_func = FunctionDeclaration(
        name="delete_task",
        description="Remove a task from the list. Use when user wants to delete/remove/cancel a task.",
        parameters={
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "integer",
                    "description": "The task ID to delete"
                }
            },
            "required": ["task_id"]
        }
    )

    # Define the update_task function
    update_task_func = FunctionDeclaration(
        name="update_task",
        description="Modify task title or description. Use when user wants to change/update/rename a task.",
        parameters={
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

    # Return the tools wrapped in a GenAITool
    return [GenAITool(function_declarations=[
        add_task_func,
        list_tasks_func,
        complete_task_func,
        delete_task_func,
        update_task_func
    ])]


def convert_mcp_tool_to_genai_function(mcp_tool: Dict[str, Any]) -> FunctionDeclaration:
    """
    Converts an MCP tool definition to a Google GenAI FunctionDeclaration.

    Args:
        mcp_tool: Dictionary representing an MCP tool definition

    Returns:
        FunctionDeclaration object for Google GenAI
    """
    input_schema = mcp_tool.get('inputSchema', {})
    properties = input_schema.get('properties', {})
    required_fields = input_schema.get('required', [])

    return FunctionDeclaration(
        name=mcp_tool.get('name', ''),
        description=mcp_tool.get('description', ''),
        parameters={
            "type": "object",
            "properties": properties,
            "required": required_fields
        }
    )


def convert_mcp_tools_to_genai(mcp_tools: List[Dict[str, Any]]) -> List[GenAITool]:
    """
    Converts a list of MCP tool definitions to Google GenAI Tools.

    Args:
        mcp_tools: List of MCP tool definitions

    Returns:
        List of GenAITool objects
    """
    genai_functions = []
    for tool in mcp_tools:
        genai_function = convert_mcp_tool_to_genai_function(tool)
        genai_functions.append(genai_function)

    return [GenAITool(function_declarations=genai_functions)]