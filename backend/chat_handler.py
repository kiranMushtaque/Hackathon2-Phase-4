"""Phase III Chat Handler - AI Agent Implementation
Orchestrates the AI agent, MCP tools, and database persistence.
"""

import json
import logging
import re
from typing import List, Dict, Any, Optional, Tuple

from sqlmodel import Session

from models import Message, TaskToolInput
from crud import (
    create_message,
    create_conversation,
    get_conversation,
    get_conversation_messages,
    get_user_conversations,
    update_conversation_title,
    get_tasks,
    create_task,
    delete_task,
    get_task,
    update_task,
)
from agent import run_agent
from mcp_server import list_tools, call_tool, set_mcp_user_id

logger = logging.getLogger(__name__)


class ChatHandler:
    """
    Handles chat interactions by orchestrating the AI agent and tools.
    """

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    async def process_message(
        self,
        message: str,
        conversation_id: Optional[int] = None
    ) -> Tuple[str, int, int]:
        """
        Process a user message, run the AI agent with tools, and return a response.
        """
        try:
            if conversation_id:
                conversation = get_conversation(self.db, conversation_id, self.user_id)
                if not conversation:
                    logger.warning(f"Conversation {conversation_id} not found for user {self.user_id}. Creating new conversation.")
                    conversation = create_conversation(self.db, self.user_id)
            else:
                conversation = create_conversation(self.db, self.user_id)
            conversation_id = conversation.id

            create_message(self.db, conversation_id, self.user_id, "user", message)
            history_for_agent = await self._get_agent_history(conversation_id)
            
            agent_response = await self._run_agent_with_tools(message, history_for_agent, conversation_id)

            response_content = agent_response.get("content", "")
            tool_calls_json = json.dumps(agent_response.get("tool_calls", [])) if agent_response.get("tool_calls") else None
            
            final_response_content = response_content if response_content else "I've processed your request."

            assistant_message = create_message(
                self.db,
                conversation_id,
                self.user_id,
                "assistant",
                final_response_content,
                tool_calls=tool_calls_json
            )

            if len(history_for_agent) <= 1:
                title = self._generate_title(message)
                update_conversation_title(self.db, conversation_id, self.user_id, title)

            return final_response_content, conversation_id, assistant_message.id
        except Exception as e:
            logger.error(f"Critical error processing message in ChatHandler: {e}", exc_info=True)
            error_message = "I'm sorry, but I encountered a critical issue while processing your request. Could you please try again? If the problem persists, please contact support."
            return error_message, conversation_id or -1, -1

    async def _fallback_intent_parsing(self, user_input: str) -> Optional[Dict[str, Any]]:
        """
        A simple regex-based fallback for intent parsing if the AI model fails.
        """
        logger.info(f"Attempting rule-based fallback for input: '{user_input}'")
        user_input_lower = user_input.lower().strip()

        # Regex for: add task <...>
        add_match = re.match(r"add(?: task)? (.+)", user_input_lower)
        if add_match:
            title = add_match.group(1).strip()
            task_input = TaskToolInput(title=title, description="", completed=False, priority="medium")
            task = create_task(self.db, task_input, self.user_id)
            return {"content": f"Task added: '{task.title}'."}

        # Regex for: list tasks
        if "list" in user_input_lower and "task" in user_input_lower:
            tasks = get_tasks(self.db, self.user_id, filter_completed=None)
            if not tasks:
                return {"content": "You have no tasks."}
            task_list_str = "Here are your tasks:\n" + "\n".join([f"- {t.title} (ID: {t.id}, Status: {'Completed' if t.completed else 'Pending'})" for t in tasks])
            return {"content": task_list_str}

        # Regex for: complete task <id>
        complete_match = re.match(r"(?:complete|done|finish) task (\d+)", user_input_lower)
        if complete_match:
            task_id = int(complete_match.group(1))
            task = get_task(self.db, task_id, self.user_id)
            if not task:
                return {"content": f"Sorry, I couldn't find task with ID {task_id}."}
            task.completed = True
            self.db.add(task)
            self.db.commit()
            return {"content": f"Task {task_id} ('{task.title}') marked as complete."}

        # Regex for: delete task <id>
        delete_match = re.match(r"delete task (\d+)", user_input_lower)
        if delete_match:
            task_id = int(delete_match.group(1))
            task = get_task(self.db, task_id, self.user_id)
            if not task:
                return {"content": f"Sorry, I couldn't find task with ID {task_id}."}
            delete_task(self.db, task_id)
            return {"content": f"Task {task_id} ('{task.title}') has been deleted."}

        logger.warning("Fallback could not match any rule.")
        return None

    async def _get_agent_history(self, conversation_id: int) -> List[Dict[str, Any]]:
        """Constructs the message history for the agent in GenAI format."""
        messages = get_conversation_messages(self.db, conversation_id, self.user_id)
        history = []
        for msg in messages:
            parts = []
            if msg.content:
                parts.append({"text": msg.content})
            if msg.tool_calls:
                try:
                    tool_calls = json.loads(msg.tool_calls)
                    for tc in tool_calls:
                        parts.append({"function_call": {"name": tc["name"], "args": tc["arguments"]}})
                    history.append({"role": "model", "parts": parts})
                    parts = []
                except (json.JSONDecodeError, TypeError) as e:
                    logger.warning(f"Malformed tool_calls in message {msg.id}: {e}")
                    if msg.content:
                        history.append({"role": "model", "parts": [{"text": msg.content}]})
                    continue
            if msg.tool_results:
                try:
                    tool_results = json.loads(msg.tool_results)
                    for tr in tool_results:
                        parts.append({"function_response": {"name": tr["id"], "response": {"content": tr["result"]}}})
                    history.append({"role": "function", "parts": parts})
                    parts = []
                except (json.JSONDecodeError, TypeError) as e:
                    logger.warning(f"Malformed tool_results in message {msg.id}: {e}")
                    if msg.content:
                        history.append({"role": "function", "parts": [{"text": msg.content}]})
                    continue
            if msg.role == "user":
                history.append({"role": "user", "parts": parts})
            elif msg.role == "assistant" and not msg.tool_calls:
                history.append({"role": "model", "parts": parts})
        return history

    async def _run_agent_with_tools(
        self,
        user_input: str,
        history: List[Dict[str, Any]],
        conversation_id: int,
    ) -> Dict[str, Any]:
        """Manages the agent-tool interaction loop."""
        agent_result = await run_agent(self.user_id, user_input, history)

        if agent_result.get("error"):
            logger.warning(f"AI agent failed with error: {agent_result['error']}. Attempting rule-based fallback.")
            fallback_result = await self._fallback_intent_parsing(user_input)
            if fallback_result:
                ai_error_content = agent_result.get("content", "I am having trouble with my AI capabilities right now.")
                fallback_content = fallback_result.get("content", "")
                combined_content = f"{ai_error_content} However, I was able to understand your request. {fallback_content}"
                return {"content": combined_content, "tool_calls": [], "error": None}
            else:
                return agent_result

        if agent_result.get("tool_calls"):
            logger.info(f"Agent requested tool calls: {agent_result['tool_calls']}")
            create_message(
                self.db, conversation_id, self.user_id, "assistant",
                agent_result.get("content", ""),
                tool_calls=json.dumps(agent_result["tool_calls"])
            )
            tool_results = []
            set_mcp_user_id(self.user_id)
            for tool_call in agent_result["tool_calls"]:
                tool_name = tool_call["name"]
                tool_args = tool_call["arguments"]
                logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
                try:
                    mcp_result = await call_tool(tool_name, tool_args)
                    result_content = mcp_result[0].text if mcp_result and hasattr(mcp_result[0], 'text') else json.dumps(mcp_result)
                    try:
                        parsed_result = json.loads(result_content)
                    except json.JSONDecodeError:
                        parsed_result = {"content": result_content}
                    tool_results.append({"id": tool_call["name"], "result": parsed_result})
                    logger.info(f"Tool {tool_name} executed successfully. Result: {result_content[:100]}...")
                except Exception as e:
                    logger.error(f"Error executing tool {tool_name} with args {tool_args}: {e}", exc_info=True)
                    tool_results.append({"id": tool_call["name"], "result": {"error": str(e)}})
            create_message(
                self.db, conversation_id, self.user_id, "tool", "",
                tool_results=json.dumps(tool_results)
            )
            updated_history_for_agent = await self._get_agent_history(conversation_id)
            final_agent_result = await run_agent(self.user_id, "", updated_history_for_agent)
            return final_agent_result
        else:
            return agent_result

    def _generate_title(self, first_message: str) -> str:
        return first_message[:50] if len(first_message) > 50 else first_message

    def get_conversations(self, skip: int = 0, limit: int = 50):
        """Get all conversations for the user"""
        return get_user_conversations(self.db, self.user_id, skip, limit)

    def get_conversation_messages(self, conversation_id: int):
        """Get all messages in a conversation"""
        return get_conversation_messages(self.db, conversation_id, self.user_id)
