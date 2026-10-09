export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

/** The core, serializable task record used by the TypeTasks engine. */
export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  notes?: string;
  project?: string;
  priority?: TaskPriority;
  /** Calendar date in YYYY-MM-DD format. */
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  status?: TaskStatus;
  notes?: string;
  project?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export type TaskUpdate = Partial<
  Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">
>;

function nextAvailableId(tasks: Task[]): number {
  const usedIds = new Set(tasks.map((task) => task.id));
  let candidate = 1;
  while (usedIds.has(candidate)) candidate += 1;
  return candidate;
}

/** Return a new array with a uniquely identified `todo` task appended. */
export function addTask(tasks: Task[], title: string): Task[] {
  const newTask: Task = {
    id: nextAvailableId(tasks),
    title: title.trim(),
    status: "todo",
  };

  return [...tasks, newTask];
}

/** Create a task with the app's optional planning fields and timestamps. */
export function createTask(tasks: Task[], input: CreateTaskInput): Task[] {
  const withCoreTask = addTask(tasks, input.title);
  const coreTask = withCoreTask[withCoreTask.length - 1];
  const now = new Date().toISOString();
  const status = input.status ?? "todo";

  const enrichedTask: Task = {
    ...coreTask,
    ...input,
    title: input.title.trim(),
    status,
    priority: input.priority ?? "medium",
    project: input.project?.trim() || "Personal",
    notes: input.notes?.trim() || undefined,
    dueDate: input.dueDate || undefined,
    createdAt: now,
    updatedAt: now,
    completedAt: status === "done" ? now : undefined,
  };

  return [...tasks, enrichedTask];
}

/** Apply a typed, immutable update to one task. */
export function updateTask(tasks: Task[], id: number, changes: TaskUpdate): Task[] {
  const now = new Date().toISOString();

  return tasks.map((task): Task => {
    if (task.id !== id) return task;

    const updated: Task = {
      ...task,
      ...changes,
      title: changes.title === undefined ? task.title : changes.title.trim(),
      notes: "notes" in changes ? changes.notes?.trim() || undefined : task.notes,
      project: "project" in changes ? changes.project?.trim() || "Personal" : task.project,
      dueDate: "dueDate" in changes ? changes.dueDate || undefined : task.dueDate,
      updatedAt: now,
    };

    if (changes.status !== undefined && changes.status !== task.status) {
      updated.completedAt = changes.status === "done" ? now : undefined;
    }

    return updated;
  });
}

/** Mark a task complete without mutating the input array. */
export function completeTask(tasks: Task[], id: number): Task[] {
  return updateTask(tasks, id, { status: "done" });
}

/** Set a task's status; moving away from done clears its completion timestamp. */
export function setTaskStatus(tasks: Task[], id: number, status: TaskStatus): Task[] {
  return updateTask(tasks, id, { status });
}

/** Return only tasks with the requested, compile-time-checked status. */
export function filterByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task): boolean => task.status === status);
}

/** Original extra operation: remove one task without mutating the input array. */
export function deleteTask(tasks: Task[], id: number): Task[] {
  return tasks.filter((task): boolean => task.id !== id);
}
