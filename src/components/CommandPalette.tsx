import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Folder,
  Inbox,
  LayoutDashboard,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ViewId } from "../App";
import type { TaskPriority } from "../../model";

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Actions" | "Filter" | "System";
  icon: React.ReactNode;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectView: (view: ViewId) => void;
  onSelectProject: (project: string) => void;
  onNewTask: (presetTitle?: string) => void;
  projects: string[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onFilterPriority?: (priority: TaskPriority) => void;
  onQuickStartTimer?: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  onSelectView,
  onSelectProject,
  onNewTask,
  projects,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands: CommandItem[] = [
    {
      id: "action-new-task",
      title: "Create new task",
      subtitle: "Add a task with tags, project and due date",
      category: "Actions",
      icon: <Plus size={16} />,
      shortcut: "N",
      run: () => {
        onClose();
        onNewTask();
      },
    },
    {
      id: "view-overview",
      title: "Go to Overview",
      subtitle: "Dashboard & radar view",
      category: "Navigation",
      icon: <LayoutDashboard size={16} />,
      run: () => {
        onClose();
        onSelectView("overview");
      },
    },
    {
      id: "view-inbox",
      title: "Go to My Tasks",
      subtitle: "All open workspace tasks",
      category: "Navigation",
      icon: <Inbox size={16} />,
      run: () => {
        onClose();
        onSelectView("inbox");
      },
    },
    {
      id: "view-today",
      title: "Go to Today",
      subtitle: "Tasks due today",
      category: "Navigation",
      icon: <CalendarDays size={16} />,
      run: () => {
        onClose();
        onSelectView("today");
      },
    },
    {
      id: "view-upcoming",
      title: "Go to Upcoming",
      subtitle: "Upcoming tasks for the next 7 days",
      category: "Navigation",
      icon: <Clock3 size={16} />,
      run: () => {
        onClose();
        onSelectView("upcoming");
      },
    },
    {
      id: "view-completed",
      title: "Go to Completed",
      subtitle: "Archived finished work",
      category: "Navigation",
      icon: <CheckCircle2 size={16} />,
      run: () => {
        onClose();
        onSelectView("completed");
      },
    },
    ...projects.map((proj) => ({
      id: `project-${proj}`,
      title: `Project: ${proj}`,
      subtitle: `Filter tasks in ${proj}`,
      category: "Navigation" as const,
      icon: <Folder size={16} />,
      run: () => {
        onClose();
        onSelectProject(proj);
      },
    })),
    {
      id: "action-toggle-theme",
      title: theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
      subtitle: "Toggle modern aesthetic surface",
      category: "System",
      icon: theme === "dark" ? <Sun size={16} /> : <Moon size={16} />,
      run: () => {
        onClose();
        onToggleTheme();
      },
    },
    {
      id: "action-toggle-sound",
      title: soundEnabled ? "Mute audio feedback" : "Enable audio feedback",
      subtitle: soundEnabled ? "Disable tactile sounds" : "Enable tactile pop and completion chime",
      category: "System",
      icon: soundEnabled ? <VolumeX size={16} /> : <Volume2 size={16} />,
      run: () => {
        onToggleSound();
        onClose();
      },
    },
    {
      id: "action-open-settings",
      title: "Open Settings",
      subtitle: "Workspace preferences, export, import",
      category: "System",
      icon: <RotateCcw size={16} />,
      shortcut: "⌘ ,",
      run: () => {
        onClose();
        onOpenSettings();
      },
    },
  ];

  const trimmed = search.trim().toLowerCase();
  const filtered = commands.filter((cmd) => {
    if (!trimmed) return true;
    return (
      cmd.title.toLowerCase().includes(trimmed) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(trimmed)) ||
      cmd.category.toLowerCase().includes(trimmed)
    );
  });

  const canCreateDirectly = trimmed.length > 0 && !filtered.some((cmd) => cmd.title.toLowerCase() === trimmed);

  const totalItems = filtered.length + (canCreateDirectly ? 1 : 0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (canCreateDirectly && selectedIndex === 0) {
        onClose();
        onNewTask(search.trim());
        return;
      }
      const actualIndex = canCreateDirectly ? selectedIndex - 1 : selectedIndex;
      if (filtered[actualIndex]) {
        filtered[actualIndex].run();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      className="command-palette-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="command-palette-card" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-palette-search">
          <Search size={18} className="command-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or create task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-palette-esc" onClick={onClose}>
            ESC
          </kbd>
        </div>

        <div className="command-palette-list" ref={listRef}>
          {canCreateDirectly && (
            <div
              className={`command-item command-create-direct ${selectedIndex === 0 ? "selected" : ""}`}
              onClick={() => {
                onClose();
                onNewTask(search.trim());
              }}
              onMouseEnter={() => setSelectedIndex(0)}
            >
              <div className="command-item-icon">
                <Plus size={16} />
              </div>
              <div className="command-item-text">
                <span className="command-item-title">
                  Create task <strong>"{search.trim()}"</strong>
                </span>
                <span className="command-item-subtitle">Press Enter to add directly</span>
              </div>
              <span className="command-shortcut">↵ Enter</span>
            </div>
          )}

          {filtered.length === 0 && !canCreateDirectly && (
            <div className="command-palette-empty">No commands match "{search}"</div>
          )}

          {filtered.map((item, idx) => {
            const itemIndex = canCreateDirectly ? idx + 1 : idx;
            const isSelected = itemIndex === selectedIndex;
            return (
              <div
                key={item.id}
                className={`command-item ${isSelected ? "selected" : ""}`}
                onClick={item.run}
                onMouseEnter={() => setSelectedIndex(itemIndex)}
              >
                <div className="command-item-icon">{item.icon}</div>
                <div className="command-item-text">
                  <span className="command-item-title">{item.title}</span>
                  {item.subtitle && <span className="command-item-subtitle">{item.subtitle}</span>}
                </div>
                {item.shortcut && <span className="command-shortcut">{item.shortcut}</span>}
                {isSelected && <span className="command-hint">↵</span>}
              </div>
            );
          })}
        </div>

        <div className="command-palette-footer">
          <div className="palette-footer-keys">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span>
              <kbd>↵</kbd> Select
            </span>
            <span>
              <kbd>ESC</kbd> Close
            </span>
          </div>
          <span className="palette-footer-brand">TypeTasks Command Bar</span>
        </div>
      </div>
    </div>
  );
}
