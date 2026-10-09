import { CheckCircle2, X } from "lucide-react";
import type { Task } from "../../model";

interface ToastProps {
  message: string;
  undoTask?: Task;
  onUndo?: () => void;
  onDismiss: () => void;
}

export default function Toast({ message, undoTask, onUndo, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <CheckCircle2 size={18} className="toast-icon" />
      <span>{message}</span>
      {undoTask && onUndo && <button className="toast-action" type="button" onClick={onUndo}>Undo</button>}
      <button className="toast-dismiss" type="button" aria-label="Dismiss notification" onClick={onDismiss}><X size={15} /></button>
    </div>
  );
}
