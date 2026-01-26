"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  Send,
  Plus,
  Trash2,
  MessageCircle,
  Bot,
  User,
  CheckCircle,
  Clock,
  Calendar,
  Tag,
  Search,
  Filter,
  MoreVertical,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Mic,
  MicOff,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  Layers,
  BarChart3,
  CheckSquare,
  AlertCircle,
  ShoppingCart,
  ListTodo,
  BellRing,
  Target,
  Copy,
  Share2,
  Download,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ====== TYPES ======
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: any[];
  tool_results?: any[];
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  updated_at?: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority?: "high" | "medium" | "low";
  tags?: string[];
  due_date?: string;
}

// ====== MAIN COMPONENT ======
export function EnhancedChatInterface() {
  const { user, token, login, logout, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [quickActionUsed, setQuickActionUsed] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: string, text: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // ===== DARK MODE TOGGLE =====
  useEffect(() => {
    const systemPref = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setDarkMode(systemPref);
    if (systemPref) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // ===== FEEDBACK MESSAGE =====
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // ===== SCROLL TO BOTTOM =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== VOICE RECOGNITION =====
  const startVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // ===== QUICK ACTIONS =====
  const quickActions = [
    {
      icon: <ShoppingCart className="w-4 h-4" />,
      text: "Add Task",
      command: "Add a task to buy groceries",
      color: "bg-blue-500",
      description: "Add groceries to your list",
    },
    {
      icon: <ListTodo className="w-4 h-4" />,
      text: "View Pending",
      command: "Show me my pending tasks",
      color: "bg-green-500",
      description: "See what needs to be done",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      text: "Complete Task",
      command: "Mark task #1 as complete",
      color: "bg-purple-500",
      description: "Finish a task",
    },
    {
      icon: <BellRing className="w-4 h-4" />,
      text: "Set Reminder",
      command: "Remind me to call mom tomorrow",
      color: "bg-amber-500",
      description: "Schedule a reminder",
    },
    {
      icon: <Target className="w-4 h-4" />,
      text: "High Priority",
      command: "Add an urgent task to finish report",
      color: "bg-red-500",
      description: "Add high priority task",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      text: "Due Today",
      command: "Show me tasks due today",
      color: "bg-indigo-500",
      description: "Check today's deadlines",
    },
  ];

  // ===== HANDLE QUICK ACTION (FIXED) =====
  const handleQuickAction = async (command: string) => {
    if (!token || !user?.id || isTyping) return;

    setQuickActionUsed(true);

    // Step 1: Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: command,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input field
    setIsTyping(true);

    // Auto-scroll to show new message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      // Step 2: Send to backend API
      const response = await fetch(`${backendUrl}/api/${user.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: command,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${errorText}`);
      }

      const data = await response.json();

      // Step 3: Add AI response to UI
      const assistantMessage: Message = {
        id: data.message_id,
        role: "assistant",
        content: data.response,
        tool_calls: data.tool_calls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentConversationId(data.conversation_id);

      // Step 4: Refresh data
      loadConversations();
      loadUserTasks();

    } catch (error: any) {
      console.error("Quick action error:", error);

      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `❌ Error: ${error.message || "Failed to process request. Please try again."}`,
        },
      ]);
    } finally {
      setIsTyping(false);
      setQuickActionUsed(false);
    }
  };

  // ===== LOAD USER TASKS =====
  const loadUserTasks = useCallback(async () => {
    if (!token || !user?.id) return;

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserTasks(data); // Load all tasks to calculate high priority count
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }, [token, user?.id, backendUrl]);

  // ===== LOAD CONVERSATIONS =====
  const loadConversations = useCallback(async () => {
    if (!token || !user?.id) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [token, user?.id, backendUrl]);

  useEffect(() => {
    if (token) {
      loadConversations();
      loadUserTasks();
    }
  }, [token, loadConversations, loadUserTasks]);

  // ===== HANDLE FORM SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !token || !user?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();

      const assistantMessage: Message = {
        id: data.message_id,
        role: "assistant",
        content: data.response,
        tool_calls: data.tool_calls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentConversationId(data.conversation_id);
      loadConversations();
      loadUserTasks();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ===== HANDLE LOGIN =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login("demo@example.com", "demo123");
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  // ===== COPY MESSAGE =====
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setFeedbackMessage({ type: 'success', text: 'Copied to clipboard!' });
  };

  // ===== SHARE CONVERSATION =====
  const shareConversation = () => {
    setFeedbackMessage({ type: 'info', text: 'Conversation shared!' });
  };

  // ===== DOWNLOAD CONVERSATION =====
  const downloadConversation = () => {
    const conversationText = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedbackMessage({ type: 'success', text: 'Downloaded!' });
  };

  // ===== REGENERATE RESPONSE =====
  const regenerateResponse = async () => {
    if (messages.length === 0) return;
    
    // Remove last assistant message
    const newMessages = [...messages];
    if (newMessages[newMessages.length - 1].role === 'assistant') {
      newMessages.pop();
    }
    
    setMessages(newMessages);
    
    // Resend last user message
    const lastUserMessage = newMessages[newMessages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      setIsTyping(true);
      
      try {
        const response = await fetch(`${backendUrl}/api/${user.id}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: lastUserMessage.content,
            conversation_id: currentConversationId,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");
        const data = await response.json();

        const assistantMessage: Message = {
          id: data.message_id,
          role: "assistant",
          content: data.response,
          tool_calls: data.tool_calls,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setCurrentConversationId(data.conversation_id);
        loadConversations();
        loadUserTasks();
      } catch (error) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  // ===== AUTHLOADING =====
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center"
          >
            <Bot className="w-8 h-8 text-white animate-pulse" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your AI assistant...
          </p>
        </div>
      </div>
    );
  }

  // ===== LOGIN SCREEN =====
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl mb-6 shadow-lg mx-auto"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Todo AI Assistant
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-400 mt-2"
            >
              Manage tasks with intelligent conversations
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Try Demo Account
                </label>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Email: demo@example.com
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Password: demo123
                    </p>
                  </div>
                  <button
                    onClick={handleLogin}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Launch Demo
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Quick Examples
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {quickActions.slice(0, 4).map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      // For demo, just show message
                      alert(`Demo: Would send "${action.command}"`);
                    }}
                    className="p-3 text-left rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {action.icon}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {action.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== MAIN CHAT INTERFACE =====
  return (
    <div
      className={`h-screen flex transition-colors ${darkMode ? "dark" : ""}`}
    >
      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${feedbackMessage.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}
          >
            {feedbackMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */} 
      <motion.div
        initial={false}
        animate={{ width: showSidebar ? 320 : 0 }}
        className={`h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden flex flex-col shadow-xl`}
      >
        {/* Sidebar Header */} 
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Todo AI
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMessages([]);
              setCurrentConversationId(null);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium mb-6 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </motion.button>
        </div>

        {/* Recent Tasks */} 
        <div className="px-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <CheckSquare className="w-4 h-4 mr-2" />
            Recent Tasks ({userTasks.filter((t) => !t.completed).length}) - 
            <span className="ml-1 text-red-500">High: {userTasks.filter((t) => !t.completed && t.priority === 'high').length}</span>
          </h3>
          <div className="space-y-2">
            {userTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${ task.completed ? "bg-green-500" : "bg-yellow-500"}`}
                    />
                    <span
                      className={`text-sm ${ task.completed
                          ? "line-through text-gray-500"
                          : "text-gray-900 dark:text-white"}`}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.priority && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${ task.priority === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"}`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            {userTasks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No tasks yet
              </p>
            )}
          </div>
        </div>

        {/* Conversations List */} 
        <div className="flex-1 px-6 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Conversations
          </h3>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`group p-3 rounded-xl cursor-pointer transition-all ${ currentConversationId === conv.id
                    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700/50"}`}
                onClick={() => {
                  // Load conversation logic here
                  setCurrentConversationId(conv.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <MessageCircle
                      className={`w-4 h-4 flex-shrink-0 ${ currentConversationId === conv.id
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-400"}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {conv.message_count} messages
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Delete conversation logic here
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* User Profile */} 
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={logout}
                className="p-2 hover:bg-red-500/20 rounded-lg"
              >
                <LogOut className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */} 
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Top Bar */} 
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI Task Manager
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentConversationId
                    ? "Active conversation"
                    : "Ready to assist"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={shareConversation}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Share conversation"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={downloadConversation}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Download conversation"
              >
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={regenerateResponse}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Regenerate last response"
              >
                <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */} 
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-8"
              >
                <Sparkles className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
              >
                Welcome to Todo AI Assistant
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-400 max-w-md mb-8"
              >
                I can help you manage tasks, set reminders, and organize your
                day. Try clicking any quick action below.
              </motion.p>

              {/* Quick Actions Grid - FIXED WORKING BUTTONS */} 
              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 w-full max-w-4xl"
                  >
                    {quickActions.map((action, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action.command)}
                        disabled={isTyping || quickActionUsed}
                        className={`p-4 text-left rounded-xl transition-all duration-300 ${ isTyping || quickActionUsed
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-lg active:scale-95"}
                        ${ darkMode
                            ? "bg-gray-800 border border-gray-700 hover:border-indigo-600"
                            : "bg-white border border-gray-200 hover:border-indigo-300"}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-lg ${action.color} text-white`}
                          >
                            {action.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {action.text}
                              </p>
                              {isTyping &&
                              action.text ===
                                quickActions.find((a) => a.command === input)
                                  ?.text ? (
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                </div>
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {action.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono truncate">
                              {`"${action.command}"`}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Tip:</span> Click any action
                  above or type commands like:
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {[ "Add task", "Show tasks", "Complete task", "Set reminder",].map((cmd, idx) => (
                    <motion.span
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      {cmd}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${ message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-5 transition-all duration-300 relative group ${ message.role === "user"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md"}`}
                  >
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ message.role === "user"
                            ? "bg-white/20"
                            : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10"}`}
                      >
                        {message.role === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">
                            {message.role === "user" ? "You" : "AI Assistant"}
                          </span>
                          {message.created_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>

                        {/* Tool Calls Display */} 
                        {message.tool_calls &&
                          message.tool_calls.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Layers className="w-4 h-4" />
                                <span>Tool Actions:</span>
                              </div>
                              {message.tool_calls.map((tool, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                                      <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {tool.name
                                        ?.replace("_", " ").toUpperCase() || "Unknown Tool"}
                                    </span>
                                  </div>
                                  {tool.arguments && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                                      {JSON.stringify(tool.arguments, null, 2)}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */} 
        <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {/* Quick Stats */} 
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {userTasks.filter((t) => !t.completed).length} pending
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {userTasks.filter((t) => !t.completed && t.priority === 'high').length} high priority
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {conversations.length} conversations
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>{showQuickActions ? "Hide" : "Show"} quick actions</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${ showQuickActions ? "rotate-90" : ""}`}
                />
              </button>
            </div>

            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message or task command..."
                  rows={1}
                  className="w-full px-5 py-4 pr-24 rounded-2xl focus:outline-none resize-none
                    bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400
                    focus:border-indigo-500 dark:focus:border-indigo-500
                    focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  disabled={isTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(
                      target.scrollHeight,
                      120
                    )}px`;
                  }}
                />
                <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`p-2 rounded-lg transition-all ${ isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"}`}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`px-6 py-4 rounded-2xl font-medium transition-all ${ input.trim() && !isTyping
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}
              >
                {isTyping ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </div>
                )}
              </motion.button>
            </div>

            {/* Quick Tips */} 
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>
                Press Enter to send • Try quick actions above for instant task
                management
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */} 
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}

// Export ChatInterface as alias for EnhancedChatInterface to fix import issue
export const ChatInterface = EnhancedChatInterface;
