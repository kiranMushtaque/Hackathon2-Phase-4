#!/usr/bin/env python3
"""Quick test to verify AI chatbot can add tasks"""
import requests
import sys

API_URL = "http://localhost:8000"
USER_ID = 1

def test_ai_add_task():
    """Test adding a task via AI chatbot"""
    print("🧪 Testing AI task addition...")

    # First, list existing tasks
    response = requests.get(f"{API_URL}/api/{USER_ID}/tasks")
    print(f"Tasks GET status: {response.status_code}")
    if response.status_code == 200:
        try:
            tasks = response.json()
            print(f"📋 Current tasks: {len(tasks)}")
            for task in tasks:
                print(f"  - {task['title']}")
        except:
            print("Could not parse tasks response")

    # Try to create a conversation
    conv_data = {"title": "Test Chat"}
    response = requests.post(f"{API_URL}/api/{USER_ID}/conversations", json=conv_data)
    print(f"\nConversation POST status: {response.status_code}")
    print(f"Response: {response.text[:300]}")

    if response.status_code == 200:
        try:
            conv = response.json()
            conv_id = conv['id']

            # Send message to AI to add a task
            chat_data = {
                "message": "Please add a task: Buy milk from the store",
                "conversation_id": conv_id
            }

            print(f"\n🤖 Sending to AI...")
            response = requests.post(f"{API_URL}/api/{USER_ID}/chat", json=chat_data)

            print(f"Chat POST status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"\n✅ AI Response: {result.get('response', 'No response')}")
                if 'tool_calls' in result:
                    print(f"Tool calls: {result.get('tool_calls', [])}")
                else:
                    print("No tool calls in response")

                # List tasks to verify
                response = requests.get(f"{API_URL}/api/{USER_ID}/tasks")
                if response.status_code == 200:
                    tasks = response.json()
                    print(f"\n📋 Updated tasks: {len(tasks)}")
                    for task in tasks:
                        print(f"  - {task['title']}")
            else:
                print(f"❌ Chat failed: {response.text}")
        except Exception as e:
            print(f"❌ Error parsing response: {e}")
            print(response.text)

    # Try direct task creation too
    print("\n" + "="*50)
    print("Testing direct task creation...")
    task_data = {"title": "Direct test task", "description": "Testing direct API"}
    response = requests.post(f"{API_URL}/api/{USER_ID}/tasks", json=task_data)
    print(f"Direct task POST status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Direct task creation successful!")
    else:
        print(f"Direct task error: {response.text}")

if __name__ == "__main__":
    test_ai_add_task()
