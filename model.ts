export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
}

export function addTask(tasks: Task[], title: string): Task[] {
  const nextId = tasks.reduce((largestId, task) => Math.max(largestId, task.id), 0) + 1;

  const newTask: Task = {
    id: nextId,
    title,
    status: "todo",
  };

  return [...tasks, newTask];
}

export function completeTask(tasks: Task[], id: number): Task[] {
  return tasks.map((task): Task =>
    task.id === id ? { ...task, status: "done" } : task,
  );
}

export function filterByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task): boolean => task.status === status);
}

// Original extra operation: remove one task without mutating the input array.
export function deleteTask(tasks: Task[], id: number): Task[] {
  return tasks.filter((task): boolean => task.id !== id);
}
