"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import {
  Bot,
  Loader2,
  LogOut,
  Plus,
  CheckCircle,
  Circle,
  Edit3,
  Trash2,
  Filter,
  Search,
  Calendar,
  Flag,
  Sun,
  Moon,
  RefreshCw,
  X,
  Save
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/");
    }
  }, [isLoading, token, router]);

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    if (!token || !user?.id) return;

    setLoadingTasks(true);
    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status}`);
      }

      const data = await response.json();
      const loadedTasks: Task[] = data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: task.priority || "medium",
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      setTasks(loadedTasks);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [token, user?.id, backendUrl]);

  useEffect(() => {
    if (token && user?.id) {
      loadTasks();
    }
  }, [token, user?.id, loadTasks]);

  // Filter tasks
  useEffect(() => {
    let result = tasks;

    if (activeFilter === "pending") {
      result = result.filter(task => !task.completed);
    } else if (activeFilter === "completed") {
      result = result.filter(task => task.completed);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    setFilteredTasks(result);
  }, [tasks, activeFilter, searchQuery]);

  // Add task via API
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !token || !user?.id) return;

    setError("");

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: "",
          completed: false,
          priority: newTaskPriority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const newTask = await response.json();
      setTasks(prev => [...prev, {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        completed: newTask.completed,
        priority: newTask.priority || "medium",
        created_at: newTask.created_at,
        updated_at: newTask.updated_at,
      }]);

      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setIsAddingTask(false);
    } catch (err: any) {
      console.error("Failed to add task:", err);
      setError(err.message || "Failed to add task");
    }
  };

  // Toggle task completion via API
  const toggleTaskCompletion = async (taskId: number) => {
    if (!token || !user?.id) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: updatedTask.completed } : t
      ));
    } catch (err) {
      console.error("Failed to toggle task:", err);
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: task.completed } : t
      ));
    }
  };

  // Delete task via API
  const deleteTask = async (taskId: number) => {
    if (!token || !user?.id) return;

    // Optimistic update
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      // Revert on error
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
    }
  };

  // Update task priority via API
  const updateTaskPriority = async (taskId: number, newPriority: "high" | "medium" | "low") => {
    if (!token || !user?.id) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, priority: newPriority } : t
    ));

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: task.title,  // Include required fields
          description: task.description,
          completed: task.completed,
          priority: newPriority,  // Update priority
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, priority: updatedTask.priority } : t
      ));
    } catch (err) {
      console.error("Failed to update task priority:", err);
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, priority: task.priority } : t
      ));
    }
  };

  // Start editing a task
  const startEditing = (task: Task) => {
    setEditingTask({ ...task });
  };

  // Save edited task
  const saveEditedTask = async () => {
    if (!editingTask || !token || !user?.id) return;

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          completed: editingTask.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(t =>
        t.id === editingTask.id ? {
          ...t,
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          completed: updatedTask.completed,
        } : t
      ));
      setEditingTask(null);
    } catch (err) {
      console.error("Failed to save task:", err);
      setError("Failed to save task");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const highPriorityCount = tasks.filter(t => t.priority === "high" && !t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                  My Tasks
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pendingCount} pending
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadTasks}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Refresh tasks"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loadingTasks ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-xs">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="mb-6 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md text-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Task Dashboard</h2>
          </div>
          <p className="text-white/90 text-sm">
            Manage your tasks efficiently. {pendingCount} pending tasks{highPriorityCount > 0 ? `, ${highPriorityCount} high priority` : ''}.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                activeFilter === "all"
                  ? "bg-indigo-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                activeFilter === "pending"
                  ? "bg-indigo-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                activeFilter === "completed"
                  ? "bg-indigo-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Add Task Section */}
        <div className="mb-6">
          {isAddingTask ? (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />

              {/* Priority Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as "high" | "medium" | "low")}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle("");
                    setNewTaskPriority("medium");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Task
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {loadingTasks ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No tasks found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "Try a different search term"
                  : activeFilter === "completed"
                    ? "You have not completed any tasks yet"
                    : "Add a new task to get started"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 bg-white dark:bg-gray-800 rounded-xl border ${
                  task.completed
                    ? "border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10"
                    : "border-gray-200 dark:border-gray-700"
                } shadow-sm hover:shadow-md transition-shadow`}
              >
                {editingTask?.id === task.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                      <select
                        value={editingTask.priority}
                        onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as "high" | "medium" | "low" })}
                        className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditedTask}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTask(null)}
                        className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-600 hover:border-indigo-500"
                      }`}
                    >
                      {task.completed && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-medium ${
                            task.completed
                              ? "text-gray-500 dark:text-gray-400 line-through"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full cursor-pointer ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                          onClick={() => {
                            const priorities: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
                            const currentIdx = priorities.indexOf(task.priority);
                            const nextPriority = priorities[(currentIdx + 1) % priorities.length];
                            updateTaskPriority(task.id, nextPriority);
                          }}
                          title="Click to change priority"
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}

                      {task.created_at && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <div>Created: {new Date(task.created_at).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(task)}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/chat"
            className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-3"
          >
            <Bot className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm opacity-80">Chat with your AI assistant</p>
            </div>
          </a>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Flag className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">High Priority</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {highPriorityCount} urgent tasks
              </p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Total Tasks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tasks.length} tasks ({tasks.filter(t => t.completed).length} completed)
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>
          Built for Panaversity Hackathon II - Manage your tasks efficiently
        </p>
      </footer>
    </div>
  );
}