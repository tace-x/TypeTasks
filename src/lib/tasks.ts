import type { Task, TaskPriority, TaskStatus } from "../../model";
import { dateKeyOffset } from "./date";

export const TASKS_STORAGE_KEY = "typetasks:tasks:v1";
export const THEME_STORAGE_KEY = "typetasks:theme:v1";
export const SESSION_STORAGE_KEY = "typetasks:focus-duration:v1";
export const DEFAULT_PROJECTS = ["Product", "Studio", "Operations", "Personal", "Research"];

const validStatuses: TaskStatus[] = ["todo", "in-progress", "done"];
const validPriorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

function timestampOffset(days: number, hour = 9): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function createDemoTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      title: "Map the first-run experience",
      status: "in-progress",
      priority: "high",
      project: "Product",
      dueDate: dateKeyOffset(0),
      notes: "Bring the onboarding steps down to one clear, welcoming path.",
      createdAt: timestampOffset(-2),
      updatedAt: now,
    },
    {
      id: 2,
      title: "Write a launch note draft",
      status: "todo",
      priority: "medium",
      project: "Product",
      dueDate: dateKeyOffset(1),
      notes: "Focus on what changed and why it matters to the team.",
      createdAt: timestampOffset(-1, 11),
      updatedAt: timestampOffset(-1, 11),
    },
    {
      id: 3,
      title: "Tidy up the component library",
      status: "todo",
      priority: "medium",
      project: "Studio",
      dueDate: dateKeyOffset(2),
      notes: "Group the shared patterns and remove anything we no longer use.",
      createdAt: timestampOffset(-1, 14),
      updatedAt: timestampOffset(-1, 14),
    },
    {
      id: 4,
      title: "Send the weekly update",
      status: "todo",
      priority: "low",
      project: "Operations",
      dueDate: dateKeyOffset(0),
      notes: "A short note with this week's progress and any open questions.",
      createdAt: timestampOffset(-3, 10),
      updatedAt: timestampOffset(-3, 10),
    },
    {
      id: 5,
      title: "Plan a screen-free evening",
      status: "todo",
      priority: "low",
      project: "Personal",
      dueDate: dateKeyOffset(4),
      notes: "Leave the calendar open and choose something outdoors.",
      createdAt: timestampOffset(-4, 17),
      updatedAt: timestampOffset(-4, 17),
    },
    {
      id: 6,
      title: "Sketch the next sprint themes",
      status: "in-progress",
      priority: "urgent",
      project: "Product",
      dueDate: dateKeyOffset(2),
      notes: "Start with the customer feedback and keep the scope small.",
      createdAt: timestampOffset(-2, 12),
      updatedAt: now,
    },
    {
      id: 7,
      title: "Review customer feedback",
      status: "done",
      priority: "high",
      project: "Research",
      dueDate: dateKeyOffset(-1),
      notes: "Pull out the themes that appeared more than once.",
      createdAt: timestampOffset(-5, 13),
      updatedAt: now,
      completedAt: now,
    },
    {
      id: 8,
      title: "Read chapters four and five",
      status: "todo",
      priority: "low",
      project: "Personal",
      dueDate: dateKeyOffset(6),
      createdAt: timestampOffset(-2, 20),
      updatedAt: timestampOffset(-2, 20),
    },
  ];
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  if (
    typeof task.id !== "number" ||
    !Number.isSafeInteger(task.id) ||
    typeof task.title !== "string" ||
    !task.title.trim() ||
    !validStatuses.includes(task.status as TaskStatus)
  ) {
    return false;
  }

  if (task.priority !== undefined && !validPriorities.includes(task.priority as TaskPriority)) {
    return false;
  }
  if (task.dueDate !== undefined && !isDateKey(task.dueDate)) return false;

  return ["notes", "project", "createdAt", "updatedAt", "completedAt"].every(
    (key) => task[key] === undefined || typeof task[key] === "string",
  );
}

export function parseTaskList(value: unknown): Task[] | null {
  if (!Array.isArray(value) || !value.every(isTask)) return null;
  const ids = new Set<number>();
  for (const task of value) {
    if (ids.has(task.id)) return null;
    ids.add(task.id);
  }
  return value;
}

export function readInitialTasks(): Task[] {
  if (typeof window === "undefined") return createDemoTasks();

  try {
    const stored = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (stored === null) return createDemoTasks();
    const parsed = parseTaskList(JSON.parse(stored) as unknown);
    return parsed ?? createDemoTasks();
  } catch {
    return createDemoTasks();
  }
}
