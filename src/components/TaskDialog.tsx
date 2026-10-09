import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Folder, Flag, Trash2, X } from "lucide-react";
import type { CreateTaskInput, Task, TaskPriority, TaskStatus } from "../../model";

interface TaskDialogProps {
  open: boolean;
  task: Task | null;
  projects: string[];
  onClose: () => void;
  onSave: (input: CreateTaskInput) => void;
  onDelete: (task: Task) => void;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function TaskDialog({ open, task, projects, onClose, onSave, onDelete }: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [project, setProject] = useState("Personal");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setProject(task?.project ?? "Personal");
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.dueDate ?? "");
    setStatus(task?.status ?? "todo");
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    onSave({
      title: cleanTitle,
      notes: notes.trim() || undefined,
      project: project.trim() || "Personal",
      priority,
      dueDate: dueDate || undefined,
      status,
    });
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="task-dialog modal-card" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">TASK DETAILS</span>
            <h2 id="task-dialog-title">{task ? "Edit task" : "Make a new task"}</h2>
          </div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close task dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.requestSubmit();
          }
        }}>
          <div className="form-field title-field">
            <label htmlFor="task-title">Task name <span className="required-mark">*</span></label>
            <input
              id="task-title"
              autoFocus
              maxLength={120}
              placeholder="What needs to get done?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="task-notes">Notes <span className="optional-label">Optional</span></label>
            <textarea
              id="task-notes"
              rows={3}
              maxLength={800}
              placeholder="Add a little context, a next step, or a link…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="task-project"><Folder size={14} /> Project</label>
              <input
                id="task-project"
                list="task-project-options"
                maxLength={60}
                placeholder="Personal"
                value={project}
                onChange={(event) => setProject(event.target.value)}
              />
              <datalist id="task-project-options">
                {[...new Set(["Personal", ...projects])].map((name) => <option key={name} value={name} />)}
              </datalist>
            </div>
            <div className="form-field">
              <label htmlFor="task-priority"><Flag size={14} /> Priority</label>
              <select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="task-due-date"><CalendarDays size={14} /> Due date</label>
              <input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="task-status">Status</label>
              <select id="task-status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            {task ? (
              <button className="delete-task-button" type="button" onClick={() => onDelete(task)}><Trash2 size={14} /> Delete task</button>
            ) : (
              <p>Tip: press <kbd>⌘</kbd> <kbd>Enter</kbd> to save</p>
            )}
            <div className="modal-actions">
              <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={!title.trim()}>
                {task ? "Save changes" : "Create task"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
