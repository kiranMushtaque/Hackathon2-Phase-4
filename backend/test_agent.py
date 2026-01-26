#!/usr/bin/env python3
"""
Test script for the Gemini AI agent to verify task addition functionality
"""
import asyncio

from agent import run_agent

async def test_add_task():
    """Test adding a task via the AI agent"""
    print("🧪 Testing AI agent task addition...")
    print("="*50)

    # Mock tools for task management
    tools = [
        {
            "name": "add_task",
            "description": "Add a new task to the todo list",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "The title of the task"},
                    "description": {"type": "string", "description": "Optional description of the task"},
                    "category": {"type": "string", "description": "Optional category for the task"}
                },
                "required": ["title"]
            }
        }
    ]

    # Test conversation history
    history = [
        {
            "role": "user",
            "parts": [{"text": "Add a new task: Buy milk"}]
        },
        {
            "role": "model",
            "parts": [{"text": "I'll help you add that task."}]
        },
        {
            "role": "user",
            "parts": [{"text": "Please add it"}]
        }
    ]

    try:
        print("🤖 Sending request to Gemini AI...")
        response = await run_agent(
            user_id=1,
            history=history,
            tools=tools
        )

        print("✅ Response received successfully!")
        print(f"Content: {response.get('content', 'No content')}")
        print(f"Tool calls: {len(response.get('tool_calls', []))}")

        if response.get('tool_calls'):
            for i, call in enumerate(response['tool_calls']):
                print(f"  Tool Call {i+1}:")
                print(f"    Function: {call.get('function')}")
                print(f"    Args: {call.get('arguments')}")

        return True

    except Exception as e:
        print(f"❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_add_task())
    sys.exit(0 if result else 1)
