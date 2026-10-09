import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Columns3,
  Inbox,
  LayoutDashboard,
  List,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  completeTask,
  createTask,
  deleteTask,
  setTaskStatus,
  updateTask,
  type CreateTaskInput,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../model";
import FocusTimer from "./components/FocusTimer";
import SettingsDialog, { type AppTheme } from "./components/SettingsDialog";
import TaskDialog from "./components/TaskDialog";
import Toast from "./components/Toast";
import {
  dateFromKey,
  formatLongDate,
  formatShortDate,
  greetingForHour,
  isOverdue,
  isWithinLastDays,
  isWithinNextDays,
  localDateKey,
  relativeDayName,
} from "./lib/date";
import {
  createDemoTasks,
  DEFAULT_PROJECTS,
  readInitialTasks,
  SESSION_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "./lib/tasks";

export type ViewId = "overview" | "inbox" | "today" | "upcoming" | "completed" | "project";
type LayoutMode = "list" | "board";
type SortMode = "due" | "priority" | "recent" | "alphabetical";
type FilterStatus = "all" | TaskStatus;
type FilterPriority = "all" | TaskPriority;

interface ToastState {
  message: string;
  undoTask?: Task;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function readTheme(): AppTheme {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function readFocusDuration(): number {
  try {
    const value = Number(window.localStorage.getItem(SESSION_STORAGE_KEY));
    return [15, 25, 50].includes(value) ? value : 25;
  } catch {
    return 25;
  }
}

function projectColorIndex(project?: string): number {
  if (!project) return 0;
  return Math.abs([...project].reduce((total, character) => total + character.charCodeAt(0), 0)) % 5;
}

function labelForView(view: ViewId, project?: string): string {
  if (view === "overview") return "Overview";
  if (view === "inbox") return "My tasks";
  if (view === "today") return "Today";
  if (view === "upcoming") return "Upcoming";
  if (view === "completed") return "Completed";
  return project ?? "Project";
}

function pageIntro(view: ViewId, project?: string): string {
  if (view === "inbox") return "Everything on your plate, gathered in one calm place.";
  if (view === "today") return "A focused view of what is due today.";
  if (view === "upcoming") return "Look a little further ahead and plan with room to breathe.";
  if (view === "completed") return "A record of the work you have already moved forward.";
  if (view === "project") return `The tasks and next steps for ${project ?? "this project"}.`;
  return "A clear space to make meaningful progress.";
}

function sortTaskList(tasks: Task[], sortMode: SortMode): Task[] {
  return [...tasks].sort((left, right) => {
    if (sortMode === "priority") {
      const priorityDifference = priorityOrder[left.priority ?? "medium"] - priorityOrder[right.priority ?? "medium"];
      if (priorityDifference !== 0) return priorityDifference;
    }
    if (sortMode === "alphabetical") return left.title.localeCompare(right.title);
    if (sortMode === "recent") {
      const leftDate = left.updatedAt ?? left.createdAt ?? "";
      const rightDate = right.updatedAt ?? right.createdAt ?? "";
      return rightDate.localeCompare(leftDate);
    }

    const leftDue = left.dueDate ?? "9999-12-31";
    const rightDue = right.dueDate ?? "9999-12-31";
    if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);
    return priorityOrder[left.priority ?? "medium"] - priorityOrder[right.priority ?? "medium"];
  });
}

function Sidebar({
  currentView,
  selectedProject,
  projects,
  tasks,
  open,
  onSelectView,
  onSelectProject,
  onNewTask,
  onOpenSettings,
  onCloseMobile,
}: {
  currentView: ViewId;
  selectedProject: string;
  projects: string[];
  tasks: Task[];
  open: boolean;
  onSelectView: (view: ViewId) => void;
  onSelectProject: (project: string) => void;
  onNewTask: () => void;
  onOpenSettings: () => void;
  onCloseMobile: () => void;
}) {
  const taskCount = tasks.length;
  const todayCount = tasks.filter((task) => task.status !== "done" && task.dueDate === localDateKey(new Date())).length;
  const upcomingCount = tasks.filter((task) => task.status !== "done" && isWithinNextDays(task.dueDate, 7)).length;
  const doneCount = tasks.filter((task) => task.status === "done").length;

  function select(view: ViewId) {
    onSelectView(view);
    onCloseMobile();
  }

  function selectProject(project: string) {
    onSelectProject(project);
    onCloseMobile();
  }

  return (
    <>
      {open && <button className="mobile-scrim" type="button" onClick={onCloseMobile} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Main navigation">
        <div className="sidebar-top">
          <button className="brand-lockup" type="button" onClick={() => select("overview")} aria-label="TypeTasks home">
            <span className="brand-mark"><Check size={19} strokeWidth={2.6} /></span>
            <span className="brand-name">type<span>tasks</span></span>
          </button>
          <button className="workspace-switcher" type="button" onClick={() => onOpenSettings()}>
            <span className="workspace-avatar">T</span>
            <span className="workspace-name"><strong>My workspace</strong><small>Personal space</small></span>
            <ChevronDown size={15} />
          </button>
        </div>

        <button className="sidebar-create-button" type="button" onClick={onNewTask}>
          <Plus size={17} strokeWidth={2.3} />
          <span>New task</span>
          <kbd>N</kbd>
        </button>

        <nav className="sidebar-nav">
          <div className="nav-section-label">WORKSPACE</div>
          <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={currentView === "overview"} onClick={() => select("overview")} />
          <NavItem icon={<Inbox size={17} />} label="My tasks" count={taskCount} active={currentView === "inbox"} onClick={() => select("inbox")} />
          <NavItem icon={<CalendarDays size={17} />} label="Today" count={todayCount} active={currentView === "today"} onClick={() => select("today")} />
          <NavItem icon={<Clock3 size={17} />} label="Upcoming" count={upcomingCount} active={currentView === "upcoming"} onClick={() => select("upcoming")} />
          <NavItem icon={<CheckCircle2 size={17} />} label="Completed" count={doneCount} active={currentView === "completed"} onClick={() => select("completed")} />

          <div className="nav-section-heading">
            <span className="nav-section-label">PROJECTS</span>
            <button type="button" className="nav-add-project" aria-label="Create a task in a new project" title="Create a task in a new project" onClick={() => onNewTask()}><Plus size={15} /></button>
          </div>
          <div className="project-nav-list">
            {projects.map((project) => {
              const count = tasks.filter((task) => task.project === project && task.status !== "done").length;
              return (
                <button
                  type="button"
                  key={project}
                  className={`nav-item project-nav-item ${currentView === "project" && selectedProject === project ? "active" : ""}`}
                  onClick={() => selectProject(project)}
                >
                  <span className={`project-dot project-color-${projectColorIndex(project)}`} />
                  <span className="nav-item-label">{project}</span>
                  <span className="nav-count">{count}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="sidebar-note-icon"><Sparkles size={16} /></div>
            <div><strong>One thing at a time.</strong><span>Your next step is enough.</span></div>
            <button type="button" onClick={() => select("overview")} aria-label="Open focus session"><ChevronRight size={15} /></button>
          </div>
          <button type="button" className="sidebar-settings" onClick={onOpenSettings}>
            <Settings size={17} /> <span>Settings</span>
            <span className="settings-shortcut">⌘ ,</span>
          </button>
          <div className="sidebar-footer">
            <div className="footer-avatar">TT</div>
            <div><strong>Local workspace</strong><span>Saved on this device</span></div>
            <span className="local-status-dot" title="Your tasks are saved locally" />
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`nav-item ${active ? "active" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined}>
      <span className="nav-item-icon">{icon}</span>
      <span className="nav-item-label">{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}

function PriorityBadge({ priority }: { priority?: TaskPriority }) {
  const value = priority ?? "medium";
  const label = value[0].toUpperCase() + value.slice(1);
  return <span className={`priority-badge priority-${value}`}><span className="priority-dot" />{label}</span>;
}

function ProjectBadge({ project }: { project?: string }) {
  return (
    <span className="project-badge">
      <span className={`project-dot project-color-${projectColorIndex(project)}`} />
      {project ?? "Personal"}
    </span>
  );
}

function StatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  return (
    <span className={`status-select-wrap status-${task.status}`}>
      <select
        aria-label={`Status for ${task.title}`}
        className="status-select"
        value={task.status}
        onChange={(event) => onChange(event.target.value as TaskStatus)}
      >
        {statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown size={12} />
    </span>
  );
}

function TaskRow({
  task,
  onOpen,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const done = task.status === "done";
  return (
    <div className={`task-row ${done ? "task-row-done" : ""}`}>
      <div className="task-row-main">
        <button
          type="button"
          className={`task-check ${done ? "checked" : task.status === "in-progress" ? "task-check-progress" : ""}`}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          onClick={() => onStatusChange(task, done ? "todo" : "done")}
        >
          {done ? <Check size={13} strokeWidth={2.6} /> : task.status === "in-progress" ? <span /> : <Circle size={19} strokeWidth={1.5} />}
        </button>
        <button type="button" className="task-title-button" onClick={() => onOpen(task)}>
          <span className="task-title">{task.title}</span>
          {task.notes && <span className="task-subtitle">{task.notes}</span>}
        </button>
      </div>
      <div className="task-row-project"><ProjectBadge project={task.project} /></div>
      <div className={`task-row-due ${isOverdue(task.dueDate, task.status) ? "due-overdue" : ""}`} title={task.dueDate ? dateFromKey(task.dueDate).toLocaleDateString() : "No due date"}>
        {task.dueDate ? <CalendarDays size={14} /> : <span className="due-no-date-dot" />}
        <span>{formatShortDate(task.dueDate)}</span>
      </div>
      <div className="task-row-priority"><PriorityBadge priority={task.priority} /></div>
      <div className="task-row-status"><StatusSelect task={task} onChange={(status) => onStatusChange(task, status)} /></div>
      <div className="task-row-actions">
        <button type="button" className="row-action" title="Edit task" aria-label={`Edit ${task.title}`} onClick={() => onOpen(task)}><Pencil size={15} /></button>
        <button type="button" className="row-action row-delete" title="Delete task" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task)}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

function CompactTaskRow({
  task,
  onOpen,
  onStatusChange,
}: {
  task: Task;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const done = task.status === "done";
  return (
    <div className={`compact-task-row ${done ? "compact-task-done" : ""}`}>
      <button type="button" className={`task-check ${done ? "checked" : ""}`} onClick={() => onStatusChange(task, done ? "todo" : "done")} aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}>
        {done ? <Check size={13} /> : <Circle size={18} strokeWidth={1.5} />}
      </button>
      <button type="button" className="compact-task-copy" onClick={() => onOpen(task)}>
        <span className="compact-task-title">{task.title}</span>
        <span className="compact-task-meta"><ProjectBadge project={task.project} /><span className="meta-separator">·</span>{formatShortDate(task.dueDate)}</span>
      </button>
      <PriorityBadge priority={task.priority} />
    </div>
  );
}

function TaskCard({
  task,
  onOpen,
  onStatusChange,
  onDragStart,
}: {
  task: Task;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDragStart: (event: DragEvent<HTMLElement>, task: Task) => void;
}) {
  return (
    <article className="board-card" draggable onDragStart={(event) => onDragStart(event, task)}>
      <div className="board-card-topline">
        <ProjectBadge project={task.project} />
        <button type="button" className="board-card-menu" aria-label={`Edit ${task.title}`} onClick={() => onOpen(task)}><MoreHorizontal size={17} /></button>
      </div>
      <button type="button" className="board-card-title" onClick={() => onOpen(task)}>{task.title}</button>
      {task.notes && <p className="board-card-notes">{task.notes}</p>}
      <div className="board-card-bottom">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && <span className={`board-due ${isOverdue(task.dueDate, task.status) ? "due-overdue" : ""}`}><CalendarDays size={13} />{formatShortDate(task.dueDate)}</span>}
      </div>
      <div className="board-card-status">
        <StatusSelect task={task} onChange={(status) => onStatusChange(task, status)} />
      </div>
    </article>
  );
}

const boardColumns: { status: TaskStatus; title: string; tone: string }[] = [
  { status: "todo", title: "To do", tone: "todo" },
  { status: "in-progress", title: "In progress", tone: "progress" },
  { status: "done", title: "Done", tone: "done" },
];

function BoardView({
  tasks,
  onOpen,
  onStatusChange,
  onNewTask,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onNewTask: () => void;
}) {
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  function handleDragStart(event: DragEvent<HTMLElement>, task: Task) {
    event.dataTransfer.setData("text/plain", String(task.id));
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    const task = tasks.find((item) => item.id === id);
    setDragOver(null);
    if (task && task.status !== status) onStatusChange(task, status);
  }

  return (
    <div className="board-grid">
      {boardColumns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);
        return (
          <section
            className={`board-column ${dragOver === column.status ? "board-column-dragover" : ""}`}
            key={column.status}
            onDragOver={(event) => { event.preventDefault(); setDragOver(column.status); }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(null);
            }}
            onDrop={(event) => handleDrop(event, column.status)}
            aria-label={`${column.title} tasks`}
          >
            <div className="board-column-heading">
              <span className={`board-status-dot board-status-${column.tone}`} />
              <h3>{column.title}</h3>
              <span className="board-column-count">{columnTasks.length}</span>
              {column.status === "todo" && <button type="button" className="board-add-button" aria-label="Add task" onClick={onNewTask}><Plus size={16} /></button>}
            </div>
            <div className="board-column-cards">
              {columnTasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} onStatusChange={onStatusChange} onDragStart={handleDragStart} />)}
              {columnTasks.length === 0 && <div className="board-empty">Drop a task here</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyState({ onNewTask, isSearch }: { onNewTask: () => void; isSearch: boolean }) {
  return (
    <div className="empty-state">
      <div className="empty-state-art"><Inbox size={26} strokeWidth={1.5} /></div>
      <h3>{isSearch ? "No tasks match that search" : "A little breathing room"}</h3>
      <p>{isSearch ? "Try a different phrase or loosen your filters." : "Nothing to show here yet. Add a task when you are ready."}</p>
      {!isSearch && <button className="button button-primary" type="button" onClick={onNewTask}><Plus size={16} /> Create a task</button>}
    </div>
  );
}

function TasksWorkspace({
  title,
  description,
  tasks,
  query,
  statusFilter,
  priorityFilter,
  sortMode,
  layout,
  onStatusFilter,
  onPriorityFilter,
  onSortMode,
  onLayout,
  onNewTask,
  onOpenTask,
  onDeleteTask,
  onStatusChange,
}: {
  title: string;
  description: string;
  tasks: Task[];
  query: string;
  statusFilter: FilterStatus;
  priorityFilter: FilterPriority;
  sortMode: SortMode;
  layout: LayoutMode;
  onStatusFilter: (status: FilterStatus) => void;
  onPriorityFilter: (priority: FilterPriority) => void;
  onSortMode: (sort: SortMode) => void;
  onLayout: (layout: LayoutMode) => void;
  onNewTask: () => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const allMatchingTasks = tasks;
  return (
    <section className="tasks-page">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow page-eyebrow">YOUR WORKSPACE <ChevronRight size={12} /> TASKS</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="button button-primary page-new-task" type="button" onClick={onNewTask}><Plus size={16} /> New task</button>
      </div>

      <div className="tasks-toolbar">
        <div className="toolbar-leading">
          <span className="task-count-label"><strong>{allMatchingTasks.length}</strong> {allMatchingTasks.length === 1 ? "task" : "tasks"}</span>
          <span className="toolbar-divider" />
          <label className="select-control"><SlidersHorizontal size={15} /><span className="sr-only">Filter by status</span>
            <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as FilterStatus)}>
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select><ChevronDown size={13} />
          </label>
          <label className="select-control priority-filter-control"><span className="sr-only">Filter by priority</span>
            <select value={priorityFilter} onChange={(event) => onPriorityFilter(event.target.value as FilterPriority)}>
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select><ChevronDown size={13} />
          </label>
          <label className="select-control sort-control"><ArrowDownUp size={15} /><span className="sr-only">Sort tasks</span>
            <select value={sortMode} onChange={(event) => onSortMode(event.target.value as SortMode)}>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="recent">Recently updated</option>
              <option value="alphabetical">Alphabetical</option>
            </select><ChevronDown size={13} />
          </label>
        </div>
        <div className="layout-switch" role="group" aria-label="Task layout">
          <button className={layout === "list" ? "selected" : ""} type="button" onClick={() => onLayout("list")} aria-label="List view" title="List view"><List size={16} /></button>
          <button className={layout === "board" ? "selected" : ""} type="button" onClick={() => onLayout("board")} aria-label="Board view" title="Board view"><Columns3 size={16} /></button>
        </div>
      </div>

      {allMatchingTasks.length === 0 ? (
        <EmptyState onNewTask={onNewTask} isSearch={Boolean(query) || statusFilter !== "all" || priorityFilter !== "all"} />
      ) : layout === "board" ? (
        <BoardView tasks={allMatchingTasks} onOpen={onOpenTask} onStatusChange={onStatusChange} onNewTask={onNewTask} />
      ) : (
        <div className="task-table-card">
          <div className="task-table-head">
            <span>Task</span><span>Project</span><span>Due date</span><span>Priority</span><span>Status</span><span />
          </div>
          <div className="task-table-body">
            {allMatchingTasks.map((task) => (
              <TaskRow key={task.id} task={task} onOpen={onOpenTask} onDelete={onDeleteTask} onStatusChange={onStatusChange} />
            ))}
          </div>
          <button className="table-add-task" type="button" onClick={onNewTask}><Plus size={15} /> Add a task</button>
        </div>
      )}
      <div className="task-page-footnote"><span className="local-status-dot" /> Changes save automatically on this device.</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>{icon}</div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row"><strong>{value}</strong><span>{detail}</span></div>
      </div>
    </article>
  );
}

function WeeklyPulse({ tasks }: { tasks: Task[] }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const count = tasks.filter((task) => task.completedAt && localDateKey(new Date(task.completedAt)) === key).length;
    return { key, count, label: relativeDayName(date).slice(0, 1) };
  });
  const maxCount = Math.max(1, ...days.map((day) => day.count));
  const countThisWeek = days.reduce((total, day) => total + day.count, 0);
  return (
    <section className="panel weekly-pulse-panel" aria-labelledby="weekly-pulse-title">
      <div className="panel-heading weekly-pulse-heading">
        <div><span className="eyebrow">A LITTLE MOMENTUM</span><h2 id="weekly-pulse-title">This week</h2></div>
        <span className="weekly-pulse-total"><strong>{countThisWeek}</strong><small>done</small></span>
      </div>
      <div className="weekly-chart" role="img" aria-label={`${countThisWeek} tasks completed in the last seven days`}>
        {days.map((day) => (
          <div className="weekly-chart-column" key={day.key}>
            <div className="weekly-bar-wrap"><span className={`weekly-bar ${day.count > 0 ? "has-value" : ""}`} style={{ height: `${Math.max(7, (day.count / maxCount) * 54)}px` }} title={`${day.count} completed`} /></div>
            <span className="weekly-day-label">{day.label}</span>
          </div>
        ))}
      </div>
      <p className="weekly-pulse-note">Progress is built one checked-off step at a time.</p>
    </section>
  );
}

function Dashboard({
  tasks,
  duration,
  onNewTask,
  onOpenTask,
  onStatusChange,
  onGoToTasks,
  onGoToUpcoming,
  onFocusComplete,
}: {
  tasks: Task[];
  duration: number;
  onNewTask: () => void;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onGoToTasks: () => void;
  onGoToUpcoming: () => void;
  onFocusComplete: () => void;
}) {
  const todayKey = localDateKey(new Date());
  const openTasks = tasks.filter((task) => task.status !== "done");
  const dueToday = openTasks.filter((task) => task.dueDate === todayKey);
  const completedThisWeek = tasks.filter((task) => task.completedAt && isWithinLastDays(localDateKey(new Date(task.completedAt)), 7)).length;
  const focusTasks = sortTaskList(dueToday.length ? dueToday : openTasks, "priority").slice(0, 4);
  const dueSoonCount = openTasks.filter((task) => isWithinNextDays(task.dueDate, 7)).length;
  const greeting = greetingForHour();

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow hero-date">{formatLongDate()}</span>
          <h1>{greeting},<br /><span>make room for good work.</span></h1>
          <p>Keep your attention on what matters. You have got this.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-orbit orbit-one" /><div className="hero-art-orbit orbit-two" />
          <div className="hero-art-sun" />
          <span className="hero-art-spark spark-one">✳</span><span className="hero-art-spark spark-two">✳</span>
          <span className="hero-art-line" />
        </div>
        <button className="button button-primary dashboard-new-task" type="button" onClick={onNewTask}><Plus size={16} /> New task</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Open tasks" value={openTasks.length} detail="ready to move" icon={<Inbox size={18} />} tone="olive" />
        <StatCard label="Due today" value={dueToday.length} detail={dueToday.length === 1 ? "one thing at a time" : "keep it focused"} icon={<CalendarDays size={18} />} tone="orange" />
        <StatCard label="In progress" value={tasks.filter((task) => task.status === "in-progress").length} detail="already underway" icon={<Clock3 size={18} />} tone="blue" />
        <StatCard label="Done this week" value={completedThisWeek} detail="nice work" icon={<CheckCircle2 size={18} />} tone="green" />
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-primary-column">
          <section className="panel radar-panel" aria-labelledby="radar-heading">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">A GOOD PLACE TO START</span>
                <h2 id="radar-heading">On your radar</h2>
                <p>{dueToday.length ? `${dueToday.length} ${dueToday.length === 1 ? "task is" : "tasks are"} due today` : "A few thoughtful next steps"}</p>
              </div>
              <button className="text-button" type="button" onClick={onGoToTasks}>All tasks <ArrowRight size={15} /></button>
            </div>
            {focusTasks.length ? (
              <div className="compact-task-list">
                {focusTasks.map((task) => <CompactTaskRow key={task.id} task={task} onOpen={onOpenTask} onStatusChange={onStatusChange} />)}
              </div>
            ) : (
              <div className="dashboard-empty"><CheckCircle2 size={21} /><div><strong>All caught up.</strong><span>Add a task whenever something new comes up.</span></div></div>
            )}
            <button className="radar-add-button" type="button" onClick={onNewTask}><Plus size={15} /> Add a task</button>
          </section>

          <section className="dashboard-lower-card">
            <div className="lower-card-icon"><Sparkles size={18} /></div>
            <div><strong>Small steps count.</strong><p>Pick one task, give it a little attention, and let that be enough for now.</p></div>
            <span className="lower-card-mark">✳</span>
          </section>
        </div>

        <aside className="dashboard-rail">
          <FocusTimer tasks={tasks} duration={duration} onComplete={onFocusComplete} />
          <WeeklyPulse tasks={tasks} />
          <div className="upcoming-nudge">
            <div className="upcoming-nudge-icon"><CalendarDays size={16} /></div>
            <div><strong>{dueSoonCount} upcoming</strong><span>tasks with a date in the next week</span></div>
            <button type="button" onClick={onGoToUpcoming} aria-label="View upcoming tasks"><ArrowRight size={15} /></button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(readInitialTasks);
  const [view, setView] = useState<ViewId>("overview");
  const [selectedProject, setSelectedProject] = useState("Product");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [sortMode, setSortMode] = useState<SortMode>("due");
  const [layout, setLayout] = useState<LayoutMode>("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(readTheme);
  const [focusDuration, setFocusDuration] = useState(readFocusDuration);
  const [toast, setToast] = useState<ToastState | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const taskDialogTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      setToast({ message: "Could not save locally. Check your browser storage settings." });
    }
  }, [tasks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains available for this session if storage is disabled.
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, String(focusDuration));
    } catch {
      // Focus duration remains available for this session if storage is disabled.
    }
  }, [focusDuration]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const projects = useMemo(() => {
    const fromTasks = tasks.map((task) => task.project).filter((project): project is string => Boolean(project));
    return [...new Set([...DEFAULT_PROJECTS, ...fromTasks])].sort((a, b) => {
      const defaultA = DEFAULT_PROJECTS.indexOf(a);
      const defaultB = DEFAULT_PROJECTS.indexOf(b);
      if (defaultA >= 0 && defaultB >= 0) return defaultA - defaultB;
      if (defaultA >= 0) return -1;
      if (defaultB >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    let result = [...tasks];
    const today = localDateKey(new Date());

    if (view === "today") {
      result = result.filter((task) => task.dueDate === today && task.status !== "done");
    } else if (view === "upcoming") {
      result = result.filter((task) => task.status !== "done" && task.dueDate !== today && isWithinNextDays(task.dueDate, 7));
    } else if (view === "completed") {
      result = result.filter((task) => task.status === "done");
    } else if (view === "project") {
      result = result.filter((task) => task.project === selectedProject);
    }

    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (normalizedQuery) {
      result = result.filter((task) => [task.title, task.notes, task.project].some((field) => field?.toLocaleLowerCase().includes(normalizedQuery)));
    }
    if (statusFilter !== "all") result = result.filter((task) => task.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((task) => (task.priority ?? "medium") === priorityFilter);
    return sortTaskList(result, sortMode);
  }, [tasks, view, selectedProject, query, statusFilter, priorityFilter, sortMode]);

  const viewTitle = labelForView(view, selectedProject);

  const openNewTask = useCallback(() => {
    taskDialogTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditingTask(null);
    setDialogOpen(true);
  }, []);

  const openTask = useCallback((task: Task) => {
    taskDialogTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const closeTaskDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingTask(null);
    window.requestAnimationFrame(() => {
      if (taskDialogTriggerRef.current?.isConnected) taskDialogTriggerRef.current.focus();
    });
  }, []);

  const handleSaveTask = useCallback((input: CreateTaskInput) => {
    if (editingTask) {
      setTasks((current) => updateTask(current, editingTask.id, input));
      setToast({ message: "Task updated" });
    } else {
      setTasks((current) => createTask(current, input));
      setToast({ message: "Task added to your workspace" });
    }
    closeTaskDialog();
  }, [editingTask, closeTaskDialog]);

  const handleDeleteTask = useCallback((task: Task) => {
    setTasks((current) => deleteTask(current, task.id));
    setToast({ message: "Task deleted", undoTask: task });
  }, []);

  const handleUndoDelete = useCallback(() => {
    const deleted = toast?.undoTask;
    if (!deleted) return;
    setTasks((current) => {
      if (current.some((task) => task.id === deleted.id)) return current;
      let id = deleted.id;
      const used = new Set(current.map((task) => task.id));
      while (used.has(id)) id += 1;
      return [...current, { ...deleted, id }];
    });
    setToast({ message: "Task restored" });
  }, [toast]);

  const handleStatusChange = useCallback((task: Task, status: TaskStatus) => {
    setTasks((current) => status === "done" ? completeTask(current, task.id) : setTaskStatus(current, task.id, status));
  }, []);

  const handleImport = useCallback((importedTasks: Task[]) => {
    setTasks(importedTasks);
    setSettingsOpen(false);
    setToast({ message: `${importedTasks.length} ${importedTasks.length === 1 ? "task" : "tasks"} imported` });
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `typetasks-backup-${localDateKey(new Date())}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast({ message: "Task backup downloaded" });
  }, [tasks]);

  const handleResetDemo = useCallback(() => {
    if (!window.confirm("Restore the sample workspace? This will replace the tasks currently saved on this device.")) return;
    setTasks(createDemoTasks());
    setSettingsOpen(false);
    setToast({ message: "Sample workspace restored" });
  }, []);

  const handleFocusComplete = useCallback(() => {
    setToast({ message: "Focus session complete. Nice work." });
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const targetTag = target?.tagName.toLowerCase();
      const isTyping = targetTag === "input" || targetTag === "textarea" || targetTag === "select" || target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      } else if (event.key.toLowerCase() === "n" && !isTyping && !event.metaKey && !event.ctrlKey && !dialogOpen && !settingsOpen) {
        event.preventDefault();
        openNewTask();
      } else if (event.key === "Escape") {
        setSettingsOpen(false);
        closeTaskDialog();
        setMobileNavOpen(false);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [closeTaskDialog, dialogOpen, openNewTask, settingsOpen]);

  function selectView(nextView: ViewId) {
    setView(nextView);
    setStatusFilter("all");
    setPriorityFilter("all");
    setQuery("");
  }

  function selectProject(project: string) {
    setSelectedProject(project);
    setView("project");
    setStatusFilter("all");
    setPriorityFilter("all");
    setQuery("");
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar
        currentView={view}
        selectedProject={selectedProject}
        projects={projects}
        tasks={tasks}
        open={mobileNavOpen}
        onSelectView={selectView}
        onSelectProject={selectProject}
        onNewTask={openNewTask}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="mobile-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{viewTitle}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search tasks…"
                aria-label="Search tasks"
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  if (nextQuery && view === "overview") setView("inbox");
                }}
              />
              {query ? <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button> : <kbd><span>⌘</span> K</kbd>}
            </div>
            <button className="topbar-icon-button" type="button" title="Settings" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Settings size={17} /></button>
            <button className="topbar-avatar" type="button" aria-label="Local workspace profile" onClick={() => setSettingsOpen(true)}>T</button>
          </div>
        </header>

        <main className="main-content">
          <div hidden={view !== "overview"}>
            <Dashboard
              tasks={tasks}
              duration={focusDuration}
              onNewTask={openNewTask}
              onOpenTask={openTask}
              onStatusChange={handleStatusChange}
              onGoToTasks={() => selectView("inbox")}
              onGoToUpcoming={() => selectView("upcoming")}
              onFocusComplete={handleFocusComplete}
            />
          </div>
          {view !== "overview" && (
            <TasksWorkspace
              title={viewTitle}
              description={pageIntro(view, selectedProject)}
              tasks={visibleTasks}
              query={query}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              sortMode={sortMode}
              layout={layout}
              onStatusFilter={setStatusFilter}
              onPriorityFilter={setPriorityFilter}
              onSortMode={setSortMode}
              onLayout={setLayout}
              onNewTask={openNewTask}
              onOpenTask={openTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
        </main>
      </div>

      <TaskDialog
        open={dialogOpen}
        task={editingTask}
        projects={projects}
        onClose={closeTaskDialog}
        onSave={handleSaveTask}
        onDelete={(task) => {
          closeTaskDialog();
          handleDeleteTask(task);
        }}
      />
      <SettingsDialog
        open={settingsOpen}
        theme={theme}
        focusDuration={focusDuration}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={setTheme}
        onFocusDurationChange={setFocusDuration}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleResetDemo}
      />
      {toast && <Toast message={toast.message} undoTask={toast.undoTask} onUndo={handleUndoDelete} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export default App;
