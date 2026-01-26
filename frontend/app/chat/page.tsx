"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Plus,
  ListTodo,
  Copy,
  Check,
  Flag,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  AlertTriangle,
  MessageSquareText,
  Home,
  Settings,
  MoreHorizontal,
  Edit3,
  Archive,
  RotateCcw,
  Square,
  Star,
  Search,
  Filter,
  Calendar,
  Tag,
  Bell,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Minus,
  Hash,
  Paperclip,
  Smile,
  Mic,
  Volume2,
  Download,
  Share2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Clock,
  CheckCheck,
  CircleDot,
  CircleDotDashed,
  Flame,
  Zap,
  Target,
  TrendingUp,
  Award,
  Heart,
  ThumbsUp,
  MessageCircle,
  Phone,
  Video,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Building,
  Globe,
  Shield,
  Key,
  CreditCard,
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  Ticket,
  Gift,
  Camera,
  Image,
  File,
  Folder,
  Code,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Gamepad2,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  VolumeX,
  Volume1,
  Volume2 as VolumeUp,
  Maximize,
  Minimize,
  RotateCcw as RotateCounterClockwise,
  RotateCw,
  Scissors,
  Ruler,
  Scissors as Cut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Unlink,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code as CodeIcon,
  Table,
  Pilcrow,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Subscript,
  Superscript,
  IndentIncrease,
  IndentDecrease,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignBaseline,
  Square as SquareIcon,
  RectangleHorizontal,
  RectangleVertical,
  Circle as CircleIcon,
  Triangle,
  Octagon,
  Hexagon,
  Pentagon,
  Diamond,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown,
  Laugh,
  Frown,
  Meh,
  Smile as SmileIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudHaze,
  CloudSun,
  CloudMoon,
  Cloudy,
  SunDim,
  SunMedium,
  Sun as SunFull,
  MoonStar,
  Eclipse,
  Sunrise,
  Sunset,
  Wind,
  Tornado,
  Hurricane,
  Thermometer,
  Droplets,
  Snowflake,
  Umbrella,
  Gauge,
  Activity,
  Pulse,
  BarChart3,
  BarChart4,
  BarChartHorizontal,
  PieChart,
  LineChart,
  AreaChart,
  ScatterChart,
  CandlestickChart,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
  Move,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  ZoomIn,
  ZoomOut,
  Hand,
  Pointer,
  MousePointer,
  Crosshair,
  Grab,
  GripVertical,
  GripHorizontal,
  Grip,
  Move3D,
  Rotate3D,
  Scale,
  Minimize2,
  Maximize2,
  Expand,
  Shrink,
  CornerUpLeft,
  CornerUpRight,
  CornerDownLeft,
  CornerDownRight,
  CornerLeftUp,
  CornerRightUp,
  CornerLeftDown,
  CornerRightDown,
  ArrowBigUp,
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowUpFromLine,
  ArrowDownFromLine,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowsUpFromLine,
  ArrowsDownFromLine,
  ArrowsLeftFromLine,
  ArrowsRightFromLine,
  ArrowsUpToLine,
  ArrowsDownToLine,
  ArrowsLeftToLine,
  ArrowsRightToLine,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  ChevronsUpDown,
  ChevronsDownUp,
  ChevronsLeftRight,
  ChevronsRightLeft,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowDownUp,
  ArrowRightLeft,
  ArrowUpZA,
  ArrowDownAZ,
  ArrowUp01,
  ArrowDown10,
  ArrowUpWideNarrow,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  ArrowUpFromSquare,
  ArrowDownFromSquare,
  ArrowUpToSquare,
  ArrowDownToSquare,
  ArrowUpSquare,
  ArrowDownSquare,
  ArrowLeftSquare,
  ArrowRightSquare,
  ArrowUpRightSquare,
  ArrowDownRightSquare,
  ArrowUpLeftSquare,
  ArrowDownLeftSquare,
  ArrowUpLeftFromSquare,
  ArrowUpRightFromSquare,
  ArrowDownLeftFromSquare,
  ArrowDownRightFromSquare,
  ArrowUpLeftToSquare,
  ArrowUpRightToSquare,
  ArrowDownLeftToSquare,
  ArrowDownRightToSquare,
  ArrowBigUpDash,
  ArrowBigDownDash,
  ArrowBigLeftDash,
  ArrowBigRightDash,
  ArrowUpNarrowWide as ArrowUpNarrowWideIcon,
  ArrowDownNarrowWide as ArrowDownNarrowWideIcon,
  ArrowUpWideNarrow as ArrowUpWideNarrowIcon,
  ArrowDownWideNarrow as ArrowDownWideNarrowIcon,
  ArrowUp01 as ArrowUp01Icon,
  ArrowDown01 as ArrowDown01Icon,
  ArrowUpAZ as ArrowUpAZIcon,
  ArrowDownAZ as ArrowDownAZIcon,
  ArrowUp10 as ArrowUp10Icon,
  ArrowDown10 as ArrowDown10Icon,
  ArrowUpWideNarrow as ArrowUpWideNarrowIcon,
  ArrowDownNarrowWide as ArrowDownNarrowWideIcon,
  ArrowUpNarrowWide as ArrowUpNarrowWideIcon,
  ArrowDownWideNarrow as ArrowDownWideNarrowIcon,
  ArrowUpFromLine as ArrowUpFromLineIcon,
  ArrowDownFromLine as ArrowDownFromLineIcon,
  ArrowLeftFromLine as ArrowLeftFromLineIcon,
  ArrowRightFromLine as ArrowRightFromLineIcon,
  ArrowUpToLine as ArrowUpToLineIcon,
  ArrowDownToLine as ArrowDownToLineIcon,
  ArrowLeftToLine as ArrowLeftToLineIcon,
  ArrowRightToLine as ArrowRightToLineIcon,
  ArrowsUpFromLine as ArrowsUpFromLineIcon,
  ArrowsDownFromLine as ArrowsDownFromLineIcon,
  ArrowsLeftFromLine as ArrowsLeftFromLineIcon,
  ArrowsRightFromLine as ArrowsRightFromLineIcon,
  ArrowsUpToLine as ArrowsUpToLineIcon,
  ArrowsDownToLine as ArrowsDownToLineIcon,
  ArrowsLeftToLine as ArrowsLeftToLineIcon,
  ArrowsRightToLine as ArrowsRightToLineIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  ChevronsDownUp as ChevronsDownUpIcon,
  ChevronsLeftRight as ChevronsLeftRightIcon,
  ChevronsRightLeft as ChevronsRightLeftIcon,
  ArrowLeftRight as ArrowLeftRightIcon,
  ArrowUpDown as ArrowUpDownIcon,
  ArrowDownUp as ArrowDownUpIcon,
  ArrowRightLeft as ArrowRightLeftIcon,
  ArrowUpZA as ArrowUpZAIcon,
  ArrowDownAZ as ArrowDownAZIcon,
  ArrowUp01 as ArrowUp01Icon,
  ArrowDown10 as ArrowDown10Icon,
  ArrowUpWideNarrow as ArrowUpWideNarrowIcon,
  ArrowDownNarrowWide as ArrowDownNarrowWideIcon,
  ArrowUpNarrowWide as ArrowUpNarrowWideIcon,
  ArrowDownWideNarrow as ArrowDownWideNarrowIcon,
  ArrowUpFromSquare as ArrowUpFromSquareIcon,
  ArrowDownFromSquare as ArrowDownFromSquareIcon,
  ArrowUpToSquare as ArrowUpToSquareIcon,
  ArrowDownToSquare as ArrowDownToSquareIcon,
  ArrowUpSquare as ArrowUpSquareIcon,
  ArrowDownSquare as ArrowDownSquareIcon,
  ArrowLeftSquare as ArrowLeftSquareIcon,
  ArrowRightSquare as ArrowRightSquareIcon,
  ArrowUpRightSquare as ArrowUpRightSquareIcon,
  ArrowDownRightSquare as ArrowDownRightSquareIcon,
  ArrowUpLeftSquare as ArrowUpLeftSquareIcon,
  ArrowDownLeftSquare as ArrowDownLeftSquareIcon,
  ArrowUpLeftFromSquare as ArrowUpLeftFromSquareIcon,
  ArrowUpRightFromSquare as ArrowUpRightFromSquareIcon,
  ArrowDownLeftFromSquare as ArrowDownLeftFromSquareIcon,
  ArrowDownRightFromSquare as ArrowDownRightFromSquareIcon,
  ArrowUpLeftToSquare as ArrowUpLeftToSquareIcon,
  ArrowUpRightToSquare as ArrowUpRightToSquareIcon,
  ArrowDownLeftToSquare as ArrowDownLeftToSquareIcon,
  ArrowDownRightToSquare as ArrowDownRightToSquareIcon,
  ArrowBigUpDash as ArrowBigUpDashIcon,
  ArrowBigDownDash as ArrowBigDownDashIcon,
  ArrowBigLeftDash as ArrowBigLeftDashIcon,
  ArrowBigRightDash as ArrowBigRightDashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tasks?: Task[];
  timestamp: string;
  tool_calls?: any[];
  tool_results?: any[];
}

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  created_at?: string;
  updated_at?: string;
}

interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

// --- SUB-COMPONENTS ---

const Sidebar = ({ onNewChat, onLogout, user, conversations, onSelectConversation, currentConversationId, totalTasksCount, isLoadingConversations }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-lg text-white flex flex-col border-r border-white/10 md:static md:translate-x-0 transform transition-transform duration-300 ease-in-out">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Task AI</h1>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(false)} 
          className="md:hidden p-1 rounded-md hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold shadow-lg"
        >
          <Plus size={18} /> New Chat
        </button>

        {/* Quick Access to Tasks Page */}
        <a
          href="/tasks"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
        >
          <ListTodo size={18} /> View All Tasks ({totalTasksCount})
        </a>

        {/* Conversation History */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">Recent Chats</h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>
          
          {isLoadingConversations ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 bg-gray-800/50 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mt-2"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No past conversations</p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg flex items-center gap-2 transition-all group",
                    conv.id === currentConversationId 
                      ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/50"
                      : "hover:bg-gray-800/50"
                  )}
                >
                  <MessageSquareText size={16} className="text-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title || 'Untitled Conversation'}</p>
                    <p className="text-xs text-gray-400">
                      {conv.message_count} {conv.message_count === 1 ? 'message' : 'messages'} •{' '}
                      {new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <MoreHorizontal size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center">
            <span className="font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="p-1.5 rounded-md hover:bg-white/10 md:hidden"
            >
              <ChevronRight size={18} />
            </button>
            <button onClick={onLogout} title="Logout" className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const ChatHeader = ({ totalTasksCount, onToggleTheme, darkMode, user }) => (
  <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/70 backdrop-blur-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <Bot className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">AI Task Manager</h1>
        <p className="text-xs text-indigo-300">{totalTasksCount} tasks managed</p>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1.5">
        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
        </div>
        <span className="text-sm text-gray-300">{user?.name}</span>
      </div>
      
      <button 
        onClick={onToggleTheme} 
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  </header>
);

const TaskCard = ({ task, onToggleComplete, onDelete, onEdit }: { 
  task: Task; 
  onToggleComplete: (id: number) => void; 
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}) => {
  const priorityColors = {
    high: "border-red-500/50 bg-red-500/10 hover:bg-red-500/15",
    medium: "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/15",
    low: "border-green-500/50 bg-green-500/10 hover:bg-green-500/15",
  };

  const priorityIcons = {
    high: <Flame className="w-4 h-4 text-red-500" />,
    medium: <Zap className="w-4 h-4 text-yellow-500" />,
    low: <Target className="w-4 h-4 text-green-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-200 hover:shadow-lg",
        priorityColors[task.priority],
        task.completed ? "opacity-70" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggleComplete(task.id)}
          className={cn(
            "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            task.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-400 dark:border-gray-500 hover:border-indigo-500"
          )}
          title={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-medium truncate",
              task.completed 
                ? "text-gray-500 dark:text-gray-400 line-through" 
                : "text-gray-900 dark:text-white"
            )}>
              {task.title}
            </h4>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => onEdit(task)}
                className="p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Edit task"
              >
                <Edit3 size={14} className="text-gray-500 hover:text-indigo-500" />
              </button>
              <button 
                onClick={() => onDelete(task.id)}
                className="p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Delete task"
              >
                <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
              </button>
            </div>
          </div>
          
          {task.description && (
            <p className={cn(
              "text-sm mt-1",
              task.completed 
                ? "text-gray-400 dark:text-gray-500 line-through" 
                : "text-gray-600 dark:text-gray-300"
            )}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              {priorityIcons[task.priority]}
              <span className="text-xs capitalize">{task.priority}</span>
            </div>
            
            {task.created_at && (
              <span className="text-xs text-gray-500">
                {new Date(task.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MessageBubble = ({ msg, onTaskToggle, onTaskDelete, onTaskEdit }: {
  msg: Message;
  onTaskToggle: (id: number) => void;
  onTaskDelete: (id: number) => void;
  onTaskEdit: (task: Task) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = msg.role === "user";
  const avatar = isUser ? (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
      <User size={18} className="text-white" />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
      <Bot size={18} className="text-white" />
    </div>
  );

  // Format tool calls and results
  const renderToolInfo = () => {
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      return (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 border border-gray-700">
          <p className="font-semibold flex items-center gap-2 mb-1">
            <CodeIcon size={12} /> Tool Calls:
          </p>
          {msg.tool_calls.map((call, i) => (
            <p key={i} className="truncate">- {call.name}({JSON.stringify(call.arguments)})</p>
          ))}
        </div>
      );
    }
    if (msg.tool_results && msg.tool_results.length > 0) {
      return (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 border border-gray-700">
          <p className="font-semibold flex items-center gap-2 mb-1">
            <CheckCheck size={12} /> Tool Results:
          </p>
          {msg.tool_results.map((result, i) => (
            <p key={i} className="truncate">- {result.id}: {JSON.stringify(result.result)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && avatar}

      <div className={cn(
        "relative group max-w-xl rounded-2xl p-4 shadow-lg",
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none"
          : "bg-gray-800 text-gray-200 rounded-bl-none"
      )}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <AnimatePresence>
              {/* Render regular message content */}
              {msg.content && msg.content.split('\n').map((line, i) => (
                <motion.p key={i} className="whitespace-pre-wrap leading-relaxed">{line}</motion.p>
              ))}
            </AnimatePresence>

            {renderToolInfo()}

            {msg.tasks && msg.tasks.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-semibold text-sm">Tasks:</h4>
                {msg.tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onTaskToggle}
                    onDelete={onTaskDelete}
                    onEdit={onTaskEdit}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-black/20"
            title="Copy message"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="text-xs text-gray-400 mt-2 text-right">{msg.timestamp}</div>
      </div>

      {isUser && avatar}
    </motion.div>
  );
};

const QuickActions = ({ onQuickAction }: { onQuickAction: (action: string) => void }) => {
  const actions = [
    { label: "Show tasks", icon: ListTodo, action: "show_tasks" },
    { label: "Add task", icon: Plus, action: "add_task" },
    { label: "Help", icon: HelpCircle, action: "help" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map((item) => (
        <button
          key={item.action}
          onClick={() => onQuickAction(item.action)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          <item.icon size={16} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const ChatInput = ({ input, setInput, handleSendMessage, isTyping, onClearChat }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(new Event('submit') as unknown as FormEvent);
    }
  };

  return (
    <form
      onSubmit={handleSendMessage}
      className="p-4 border-t border-white/10 bg-gray-900/70 backdrop-blur-lg sticky bottom-0"
    >
      <div className="max-w-3xl mx-auto">
        <QuickActions onQuickAction={(action) => {
          switch(action) {
            case 'show_tasks':
              window.location.href = '/tasks';
              break;
            case 'add_task':
              setInput('Add a new task: ');
              break;
            case 'help':
              setInput('Help me with tasks');
              break;
          }
        }} />
        
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-2 flex items-end gap-2 shadow-2xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to manage your tasks..."
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 min-h-[24px] max-h-40 text-gray-100 placeholder-gray-500"
            rows={1}
            disabled={isTyping}
          />
          
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onClearChat}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RotateCcw size={18} />
            </button>
            
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function ChatPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !token) router.push("/");
  }, [authLoading, token, router]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Set dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const fetchConversations = useCallback(async () => {
    if (!token || !user?.id) return; 
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/conversations`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      const data: Conversation[] = await response.json();
      setConversations(data);
    } catch (err: any) {
      console.error("Failed to fetch conversations:", err);
      setError(err.message || "Failed to load past conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token, user?.id, backendUrl]);

  const fetchMessagesForConversation = useCallback(async (convId: number) => {
    if (!token || !user?.id) return;
    setIsTyping(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/conversations/${convId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch messages: ${response.statusText}`);
      const data: Message[] = await response.json();
      // Convert backend Message format to frontend Message format
      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }),
        tool_calls: msg.tool_calls,
        tool_results: msg.tool_results,
      }));
      setMessages(formattedMessages);
      setConversationId(convId);
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
      setError(err.message || "Failed to load conversation messages.");
    } finally {
      setIsTyping(false);
    }
  }, [token, user?.id, backendUrl]);

  const fetchTotalTasksCount = useCallback(async () => {
    if (!token || !user?.id) return;
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tasks?status=all`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch tasks count: ${response.statusText}`);
      const data = await response.json();
      setTotalTasksCount(data.length);
    } catch (err) {
      console.error("Failed to fetch total tasks count:", err);
    }
  }, [token, user?.id, backendUrl]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !token || !user?.id) return;

    const userInput = input.trim();
    addMessage({ role: "user", content: userInput });
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: userInput, conversation_id: conversationId }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const data = await response.json();
      // Update conversation ID if this is a new conversation
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }
      addMessage({
        role: "assistant",
        content: data.response,
        tool_calls: data.tool_calls, // Pass tool calls from backend
      });
      fetchConversations(); // Refresh conversations list after new message
      fetchTotalTasksCount(); // Refresh task count

    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to get a response. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    addMessage({ role: "assistant", content: "Hello! How can I help you with your tasks today?" });
    fetchConversations(); // Refresh sidebar after starting new chat
  };

  const handleTaskToggle = (taskId: number) => {
    // This would typically make an API call to update the task
  };

  const handleTaskDelete = (taskId: number) => {
    // This would typically make an API call to delete the task
  };

  const handleTaskEdit = (task: Task) => {
    // This would typically open an edit modal
    setInput(`Update task "${task.title}" to: `);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this chat?")) {
      startNewChat();
    }
  };

  useEffect(() => {
    if (token && user?.id) {
        fetchConversations();
        fetchTotalTasksCount();
        startNewChat(); // Start a new chat session on initial load
    }
  }, [token, user?.id, fetchConversations, fetchTotalTasksCount]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-2 text-gray-400">Loading your AI assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-screen w-screen flex antialiased text-gray-200 bg-gray-900", darkMode ? 'dark' : '')}>
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
        >
          {sidebarOpen ? <X size={20} /> : <MessageSquareText size={20} />}
        </button>
      </div>
      
      <div className={cn("fixed inset-0 z-40 bg-black/50 transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setSidebarOpen(false)}>
      </div>
      
      <Sidebar
        onNewChat={startNewChat}
        onLogout={logout}
        user={user}
        conversations={conversations}
        onSelectConversation={fetchMessagesForConversation}
        currentConversationId={conversationId}
        totalTasksCount={totalTasksCount}
        isLoadingConversations={isLoadingConversations}
      />
      
      <main className="flex-1 md:ml-64 flex flex-col">
        <ChatHeader 
          totalTasksCount={totalTasksCount} 
          darkMode={darkMode} 
          onToggleTheme={() => setDarkMode(!darkMode)} 
          user={user}
        />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence>
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  msg={msg} 
                  onTaskToggle={handleTaskToggle}
                  onTaskDelete={handleTaskDelete}
                  onTaskEdit={handleTaskEdit}
                />
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex justify-start"
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="flex space-x-1.5">
                    <motion.div 
                      animate={{ y: [0, -4, 0] }} 
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} 
                      className="w-2 h-2 bg-gray-500 rounded-full" 
                    />
                    <motion.div 
                      animate={{ y: [0, -4, 0] }} 
                      transition={{ duration: 0.8, delay: 0.1, repeat: Infinity, ease: "easeInOut" }} 
                      className="w-2 h-2 bg-gray-500 rounded-full" 
                    />
                    <motion.div 
                      animate={{ y: [0, -4, 0] }} 
                      transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, ease: "easeInOut" }} 
                      className="w-2 h-2 bg-gray-500 rounded-full" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/20 border border-red-500/50"
              >
                <AlertTriangle className="text-red-400" />
                <p className="text-red-300 flex-1">{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <ChatInput 
          input={input} 
          setInput={setInput} 
          handleSendMessage={handleSendMessage} 
          isTyping={isTyping}
          onClearChat={handleClearChat}
        />
      </main>
    </div>
  );
}
