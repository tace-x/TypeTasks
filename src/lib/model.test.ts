import { describe, expect, it } from "vitest";
import {
  addTask,
  completeTask,
  createTask,
  deleteTask,
  filterByStatus,
  setTaskStatus,
  updateTask,
  type Task,
} from "../../model";

const sampleTasks: Task[] = [
  { id: 1, title: "Plan the week", status: "todo", dueDate: "2026-10-12" },
  { id: 3, title: "Send the outline", status: "in-progress", priority: "high" },
];

describe("TypeTasks engine", () => {
  it("adds an immutable todo task with an unused id", () => {
    const result = addTask(sampleTasks, "  Draft notes  ");

    expect(result).not.toBe(sampleTasks);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ id: 2, title: "Draft notes", status: "todo" });
    expect(sampleTasks).toHaveLength(2);
  });

  it("creates a task with typed planning metadata and defaults", () => {
    const result = createTask(sampleTasks, { title: "  Review flow  " });
    const created = result[result.length - 1];

    expect(created.title).toBe("Review flow");
    expect(created.status).toBe("todo");
    expect(created.priority).toBe("medium");
    expect(created.project).toBe("Personal");
    expect(created.createdAt).toBeTruthy();
  });

  it("completes only the matching task without mutating the input", () => {
    const result = completeTask(sampleTasks, 1);

    expect(result[0].status).toBe("done");
    expect(result[0].completedAt).toBeTruthy();
    expect(result[1]).toEqual(sampleTasks[1]);
    expect(sampleTasks[0].status).toBe("todo");
  });

  it("filters by a valid status", () => {
    expect(filterByStatus(sampleTasks, "in-progress").map((task) => task.id)).toEqual([3]);
  });

  it("deletes one task immutably", () => {
    const result = deleteTask(sampleTasks, 3);

    expect(result.map((task) => task.id)).toEqual([1]);
    expect(sampleTasks).toHaveLength(2);
  });

  it("updates task fields and clears optional values explicitly", () => {
    const result = updateTask(sampleTasks, 1, {
      title: "Revised plan",
      dueDate: undefined,
      notes: undefined,
    });

    expect(result[0].title).toBe("Revised plan");
    expect(result[0].dueDate).toBeUndefined();
    expect(result[0].notes).toBeUndefined();
    expect(sampleTasks[0].dueDate).toBe("2026-10-12");
  });

  it("clears completion metadata when reopening a task", () => {
    const doneTask: Task = { id: 10, title: "Already done", status: "done", completedAt: "2026-10-08T10:00:00.000Z" };
    const result = setTaskStatus([doneTask], 10, "in-progress");

    expect(result[0].status).toBe("in-progress");
    expect(result[0].completedAt).toBeUndefined();
    expect(doneTask.status).toBe("done");
  });
});
