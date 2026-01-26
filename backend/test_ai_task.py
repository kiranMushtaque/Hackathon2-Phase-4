#!/usr/bin/env python3
"""Test script to verify AI chatbot can add tasks"""
import requests
import json

API_URL = "http://localhost:8000"
USER_ID = 1

def test_add_task_via_ai():
    """Test adding a task through AI chatbot"""
    print("🧪 Testing AI task addition...")

    # Create a conversation
    conv_data = {
        "title": "Test Conversation"
    }
    response = requests.post(f"{API_URL}/api/{USER_ID}/conversations", json=conv_data)
    if response.status_code != 200:
        print(f"❌ Failed to create conversation: {response.status_code}")
        return False

    conv = response.json()
    print(f"✅ Conversation created: {conv['id']}")

    # Send a message to AI to add a task
    chat_data = {
        "message": "Please add a task: Buy milk from the store",
        "conversation_id": conv['id']
    }

    print("🤖 Sending message to AI: 'Please add a task: Buy milk from the store'")
    response = requests.post(f"{API_URL}/api/{USER_ID}/chat", json=chat_data)

    if response.status_code == 200:
        result = response.json()
        print(f"✅ AI Response: {result.get('response', 'No response')}")
        print(f"Tool calls: {result.get('tool_calls', [])}")

        # Check if task was added
        tasks_response = requests.get(f"{API_URL}/api/{USER_ID}/tasks")
        if tasks_response.status_code == 200:
            tasks = tasks_response.json()
            print(f"\n📋 Current tasks ({len(tasks)} total):")
            for task in tasks[:5]:  # Show first 5
                print(f"  - {task['title']} (ID: {task['id']})")

            return True
    else:
        print(f"❌ AI chat failed: {response.status_code}")
        print(f"Error: {response.text}")

    return False

if __name__ == "__main__":
    try:
        success = test_add_task_via_ai()
        if success:
            print("\n✅ Test completed successfully! AI can add tasks.")
        else:
            print("\n❌ Test failed.")
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
