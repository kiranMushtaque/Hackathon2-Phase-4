# phase3/backend/agent.py
"""
Phase III AI Agent - Google GenAI API Implementation
Uses Google GenAI for chat with tool use.
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncio # Import asyncio for list_models call

# Import the newer Google Generative AI library
import google.generativeai as genai  

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Global/Cached Model Configuration ---
_cached_model_name: Optional[str] = None
_cached_generative_model: Any = None

# --- Environment Variables ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.critical("CRITICAL: GEMINI_API_KEY environment variable not set. Agent will not function without it.")
else:
    logger.info("GEMINI_API_KEY environment variable found.")

GEMINI_MODEL_ENV = os.getenv("GEMINI_MODEL")
if GEMINI_MODEL_ENV:
    logger.info(f"GEMINI_MODEL environment variable set to: {GEMINI_MODEL_ENV}")
else:
    logger.info("GEMINI_MODEL environment variable not set. Will use default model.")

# --- Agent Instructions ---
AGENT_INSTRUCTIONS = f"""You are a helpful and friendly AI assistant for managing a user's todo list. Your name is Gemini. Today's date is {datetime.now().strftime('%A, %B %d, %Y')}.

Your main capabilities are:
1.  **Add tasks**: Use the `add_task` tool.
2.  **List tasks**: Use the `list_tasks` tool. When you display tasks, format them clearly. Use emojis for priority (🔴 High, 🟡 Medium, 🔵 Low).
3.  **Update tasks**: Use the `update_task` tool.
4.  **Complete tasks**: Use the `complete_task` tool.
5.  **Delete tasks**: Use the `delete_task` tool.

**Conversation Flow:**
- When the user asks to perform an action, use the appropriate tool.
- After successfully executing a tool (e.g., adding or completing a task), confirm the action with a friendly and concise message.
- If a user's request is ambiguous, ask for clarification.
- Do not use markdown formatting in your text responses.
- Provide natural language error messages when something goes wrong.
- Be empathetic and helpful when addressing user concerns.
- Always acknowledge the user's request before taking action.
"""

async def get_supported_gemini_model_name(api_key: str, preferred_model: Optional[str] = None) -> Optional[str]:
    """
    Dynamically detects an available Gemini model that supports function calling.
    Prioritizes preferred_model if specified and available.
    """
    logger.info("Attempting to detect supported Gemini model name.")
    if not api_key:
        logger.error("API key is required to list Gemini models. Cannot proceed with model detection.")
        return None

    # Configure the API key for the library
    genai.configure(api_key=api_key)

    available_models_with_tools = []
    try:
        # List models using the newer library approach
        for model in genai.list_models():
            # Check if model supports function calling in newer library
            if "functions" in model.supported_generation_methods:
                available_models_with_tools.append(model.name)
                logger.debug(f"Model '{model.name}' supports function calling.")
    except Exception as e:
        logger.error(f"Error listing Gemini models: {e}", exc_info=True)
        # Fallback to hardcoded models
        hardcoded_fallbacks = [
            'gemini-1.5-flash',
            'gemini-1.0-pro',
        ]
        logger.warning(f"Falling back to hardcoded models: {hardcoded_fallbacks}")
        return next((m for m in hardcoded_fallbacks if m.startswith('gemini')), None)

    if not available_models_with_tools:
        logger.error("No Gemini models found that support function calling with the provided API key.")
        return None

    logger.info(f"Available models supporting function calling: {available_models_with_tools}")

    if preferred_model and preferred_model in available_models_with_tools:
        logger.info(f"Using preferred model from environment: {preferred_model}")
        return preferred_model

    priority_models_ordered = [
        'gemini-1.5-flash',
        'gemini-1.0-pro',
    ]

    for model_name in priority_models_ordered:
        if model_name in available_models_with_tools:
            logger.info(f"Selected priority model: {model_name}")
            return model_name

    if available_models_with_tools:
        selected = available_models_with_tools[0]
        logger.warning(f"No priority model found, selecting first available: {selected}")
        return selected

    logger.error("Could not find any suitable Gemini model for function calling.")
    return None

async def initialize_generative_model(api_key: str, model_name: str, tools: list) -> Any:
    """Initializes and returns the GenerativeModel instance."""
    logger.info(f"Initializing GenerativeModel with model_name: {model_name}")
    try:
        # Configure the API key for the library
        genai.configure(api_key=api_key)
        
        # Prepare safety settings for newer library
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH", 
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            },
        ]
        
        # Prepare generation config for newer library
        generation_config = genai.GenerationConfig(
            temperature=0.7,
            top_p=1,
            top_k=1,
            max_output_tokens=2048,
        )
        
        # Create the model instance
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=generation_config,
            safety_settings=safety_settings,
            tools=tools
        )

        logger.info(f"Successfully initialized GenerativeModel: {model_name} with {len(tools)} tools.")
        return model
    except Exception as e:
        logger.error(f"Failed to initialize GenerativeModel '{model_name}'. Check model name and API key permissions. Details: {e}", exc_info=True)
        return None

# --- Import Tools from agent_tools.py ---
from agent_tools import get_genai_task_management_tools

async def get_generative_model() -> Any:
    """
    Retrieves the initialized GenerativeModel, initializing it if not already done.
    Uses cached model name and object.
    """
    global _cached_model_name, _cached_generative_model

    if _cached_generative_model:
        logger.info("Using cached GenerativeModel.")
        return _cached_generative_model

    logger.info("GenerativeModel not cached, attempting to initialize.")
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not set. Cannot initialize GenerativeModel.")
        return None

    if not _cached_model_name:
        logger.info("Model name not cached, attempting to detect a suitable model.")
        _cached_model_name = await get_supported_gemini_model_name(GEMINI_API_KEY, GEMINI_MODEL_ENV)
        if not _cached_model_name:
            logger.error("Failed to determine a suitable Gemini model name. Cannot initialize GenerativeModel.")
            return None
        logger.info(f"Detected or selected model name: {_cached_model_name}")

    genai_tools = get_genai_task_management_tools()
    _cached_generative_model = await initialize_generative_model(GEMINI_API_KEY, _cached_model_name, genai_tools)
    return _cached_generative_model


async def run_agent(
    user_id: int,
    user_input: str,
    history: List[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run the AI agent with the Google GenAI API.
    Args:
        user_id: The ID of the user.
        user_input: The current message from the user.
        history: The full conversation history (list of message dicts).
    Returns:
        Dict with 'content' (AI response), 'tool_calls' (if any), 'error' (if any).
    """

    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not set in run_agent. Returning configuration error.")
        return {
            "content": "API key not configured for Gemini. Please set GEMINI_API_KEY.",
            "tool_calls": [],
            "error": "Configuration Error: GEMINI_API_KEY is missing."
        }

    model = await get_generative_model()
    if not model:
        logger.error("Failed to get GenerativeModel instance. Returning AI service initialization error.")
        return {
            "content": "I'm sorry, I couldn't initialize the AI service. Please check API key and model availability.",
            "tool_calls": [],
            "error": "AI Service Initialization Error."
        }

    try:
        formatted_history = []
        if history:
            for msg in history:
                role = msg.get('role')
                parts = []
                if isinstance(msg.get('parts'), list):
                    for part in msg['parts']:
                        if isinstance(part, dict) and 'text' in part:
                            parts.append({'text': part['text']})
                        elif isinstance(part, dict) and 'function_call' in part:
                            parts.append({'function_call': part['function_call']})
                        elif isinstance(part, dict) and 'function_response' in part:
                            func_resp = part['function_response']
                            if isinstance(func_resp, dict) and 'name' in func_resp and 'response' in func_resp:
                                parts.append({'function_response': func_resp})
                            else:
                                logger.warning(f"Malformed function_response in history: {func_resp}")
                                if 'name' in func_resp and 'content' in func_resp:
                                    parts.append({'function_response': {'name': func_resp['name'], 'response': {'content': func_resp['content']}}})

                if parts:
                    formatted_history.append({'role': role, 'parts': parts})

        chat = model.start_chat(history=formatted_history)

        logger.info(f"📤 Sending message to GenAI. User input: '{user_input[:50]}...' History length: {len(formatted_history)}")

        try:
            response = await chat.send_message_async(user_input)
            logger.info("📥 Response received from GenAI.")
        except genai.types.BlockedPromptException as e:
            logger.error(f"GenAI BlockedPromptException: {e}", exc_info=True)
            return {
                "content": "I'm sorry, your request was blocked due to safety concerns. Please try rephrasing.",
                "tool_calls": [],
                "error": f"BlockedPromptException: {e}"
            }
        except genai.types.ResponseValidationError as e:
            logger.error(f"GenAI ResponseValidationError (tool issue?): {e}", exc_info=True)
            return {
                "content": "I encountered an issue processing a tool's response or preparing a tool call. "
                           "This might be a temporary API issue or a malformed tool definition.",
                "tool_calls": [],
                "error": f"ResponseValidationError: {e}"
            }
        except genai.types.RetryError as e: # Catch API related client errors
            logger.error(f"GenAI RetryError: {e}", exc_info=True)
            if "429" in str(e):
                return {
                    "content": "I'm sorry, but we're experiencing high demand and have reached our usage limit for the AI service. Please try again later.",
                    "tool_calls": [],
                    "error": "QuotaExceededError: The user has sent too many requests in a given amount of time."
                }
            return {
                "content": "There was a client-side error communicating with the Gemini API. "
                           "Please check your network or API key permissions, or try again later.",
                "tool_calls": [],
                "error": f"RetryError: {e}"
            }
        except Exception as send_error:
            logger.error(f"Error sending message to model: {send_error}", exc_info=True)
            return {
                "content": "I'm sorry, I couldn't get a response from the AI. "
                           "It might be a temporary issue or an invalid model/API key combination.",
                "tool_calls": [],
                "error": f"AI Response Error: {send_error}"
            }

        response_content = ""
        tool_calls = []

        # For newer library
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if not hasattr(candidate, 'content') or not hasattr(candidate.content, 'parts'):
                logger.warning("Gemini response candidate has no content parts. The model might have been blocked.")
                return {
                    "content": "The AI provided an empty or malformed response. This might be due to safety settings. Please try again.",
                    "tool_calls": [],
                    "error": "Empty AI Response or blocked content."
                }

            for part in candidate.content.parts:
                if hasattr(part, 'text') and part.text:
                    response_content += part.text
                elif hasattr(part, 'function_call'):
                    try:
                        function_call = part.function_call
                        if function_call:
                            # Extract arguments from function call for newer library
                            args_dict = {}
                            if hasattr(function_call, 'args') and function_call.args:
                                # Handle different ways args might be represented in the newer library
                                if isinstance(function_call.args, dict):
                                    args_dict = function_call.args
                                elif hasattr(function_call.args, '__dict__'):
                                    # If it's an object with attributes
                                    args_dict = vars(function_call.args)
                                else:
                                    # Try to convert to dict if it's a protobuf-like object
                                    try:
                                        import json
                                        args_str = str(function_call.args)
                                        # Try parsing as JSON if possible
                                        if args_str.startswith('{') and args_str.endswith('}'):
                                            args_dict = json.loads(args_str)
                                        else:
                                            # If it's not JSON, try to extract values differently
                                            args_dict = {k: v for k, v in function_call.args.items()} if hasattr(function_call.args, 'items') else {}
                                    except:
                                        logger.warning(f"Could not parse function call args: {function_call.args}")
                                        args_dict = {}

                            tool_calls.append({
                                "id": function_call.name,
                                "name": function_call.name,
                                "arguments": args_dict,
                            })
                            logger.info(f"Tool call detected (new library): {function_call.name} with arguments: {args_dict}")
                    except Exception as e:
                        logger.error(f"Error processing function call (new library): {e}", exc_info=True)
                        continue

        logger.info(f"Agent response: {response_content[:100]}... Tool calls: {len(tool_calls)}")

        return {
            "content": response_content,
            "tool_calls": tool_calls,
            "error": None
        }

    except Exception as e:
        logger.error(f"❌ GenAI agent general error: {str(e)}", exc_info=True)
        return {
            "content": "I'm sorry, but I'm currently experiencing some technical difficulties. Please try again in a moment. If the issue persists, it might be related to my AI services being temporarily unavailable.",
            "tool_calls": [],
            "error": f"General Agent Error: {str(e)}"
        }

# --- Test function as requested ---
if __name__ == "__main__":
    import asyncio

    if not os.getenv("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY environment variable not set. Using a dummy key for direct agent.py testing. "
              "Please set it (e.g., export GEMINI_API_KEY='your_key_here') for actual application use.")
        os.environ["GEMINI_API_KEY"] = "YOUR_DUMMY_GEMINI_API_KEY"

    async def test_run_agent_functionality():
        print("\n--- Running agent.py direct test suite ---")

        print("\n--- Testing run_agent with 'add task' ---")
        res = await run_agent(user_id=1, user_input="Add a task: Buy milk")
        print(f"Test Result: {json.dumps(res, indent=2)}")

        print("\n--- Testing run_agent with 'list tasks' ---")
        res = await run_agent(user_id=1, user_input="List all my tasks")
        print(f"Test Result: {json.dumps(res, indent=2)}")

        print("\n--- Testing run_agent with simple chat ---")
        res = await run_agent(user_id=1, user_input="Hello, how are you?")
        print(f"Test Result: {json.dumps(res, indent=2)}")

    asyncio.run(test_run_agent_functionality())