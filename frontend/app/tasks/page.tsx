'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Loader2,
  Bot,
  Sparkles,
  Sun,
  Moon,
  MessageCircle,
  Flag,
  Save,
  X,
  RefreshCw
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  created_at?: string;
  updated_at?: string;
}

export default function TasksPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/');
    }
  }, [authLoading, token, router]);

  // Load dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load tasks when authenticated
  const loadTasks = useCallback(async () => {
    if (!token || !user?.id) return;

    setLoadingTasks(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
      }

      const tasksData = await response.json();

      const loadedTasks: Task[] = tasksData.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: task.priority || 'medium',
        created_at: task.created_at,
        updated_at: task.updated_at
      }));

      setTasks(loadedTasks);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      setError(error.message || 'Failed to load tasks. Please try again.');
    } finally {
      setLoadingTasks(false);
    }
  }, [token, user?.id, backendUrl]);

  useEffect(() => {
    if (token && user?.id) {
      loadTasks();
    }
  }, [token, user?.id, loadTasks]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !token || !user?.id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTask.trim(),
          description: newDescription.trim() || undefined,
          completed: false,
          priority: newPriority
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add task: ${response.status} - ${errorText}`);
      }

      const newTaskData = await response.json();

      const newTaskObj: Task = {
        id: newTaskData.id,
        title: newTaskData.title,
        description: newTaskData.description,
        completed: newTaskData.completed,
        priority: newTaskData.priority || 'medium',
        created_at: newTaskData.created_at,
        updated_at: newTaskData.updated_at
      };

      setTasks(prev => [...prev, newTaskObj]);
      setNewTask('');
      setNewDescription('');
      setNewPriority('medium');
    } catch (error) {
      console.error('Failed to add task:', error);
      setError('Failed to add task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskCompletion = async (taskId: number) => {
    if (!token || !user?.id) return;

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const newCompletedStatus = !currentTask.completed;

    try {
      // Optimistic update
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed: newCompletedStatus } : task
        )
      );

      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed: updatedTask.completed } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Failed to update task. Please try again.');
      // Revert
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed: !newCompletedStatus } : task
        )
      );
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!token || !user?.id) return;

    const taskToDelete = tasks.find(t => t.id === taskId);

    try {
      // Optimistic update
      setTasks(prev => prev.filter(task => task.id !== taskId));

      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('Failed to delete task. Please try again.');
      // Revert
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask({ ...task });
  };

  const saveEdit = async () => {
    if (!editingTask || !token || !user?.id) return;

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          completed: editingTask.completed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();

      setTasks(prev =>
        prev.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                completed: updatedTask.completed
              }
            : task
        )
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const updateTaskPriority = async (taskId: number, newPriority: 'high' | 'medium' | 'low') => {
    if (!token || !user?.id) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t)
    );

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priority: newPriority
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task priority');
      }

      const updatedTask = await response.json();
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, priority: updatedTask.priority } : t)
      );
    } catch (error) {
      console.error('Failed to update task priority:', error);
      // Revert
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, priority: task.priority } : t)
      );
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                  Todo AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Task Management
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={loadTasks}
                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Refresh tasks"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loadingTasks ? 'animate-spin' : ''}`} />
              </button>

              {/* Chat Link */}
              <a
                href="/chat"
                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Chat"
              >
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </a>

              {/* Dashboard Link */}
              <a
                href="/dashboard"
                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Dashboard"
              >
                <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </a>

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
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

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                title="Logout"
              >
                <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Task Management</h2>
          </div>
          <p className="text-white/90 text-sm">
            {pendingCount} pending tasks{highPriorityCount > 0 ? ` (${highPriorityCount} high priority)` : ''}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add Task Form */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Task</h3>
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                id="taskTitle"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="taskDescription"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add details about this task..."
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div>
              <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="taskPriority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newTask.trim()}
              className="w-full py-3 px-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Adding Task...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Task</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tasks List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Tasks ({pendingCount} pending)
            </h3>
          </div>

          {loadingTasks ? (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Loading your tasks...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks yet</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Add your first task to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {editingTask?.id === task.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white font-medium"
                      />
                      <textarea
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                        rows={2}
                        placeholder="Description (optional)"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                        <select
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'high' | 'medium' | 'low' })}
                          className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                        }`}
                        title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.completed && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-medium ${
                            task.completed
                              ? 'text-gray-500 dark:text-gray-400 line-through'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200'
                            }`}
                            onClick={() => {
                              const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
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
                          <p className={`text-sm mt-1 ${
                            task.completed
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        {task.created_at && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Created: {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="p-1.5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Tasks
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Completed
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pending
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {highPriorityCount}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              High Priority
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Built for Panaversity Hackathon II - Manage your tasks efficiently</p>
      </footer>
    </div>
  );
}