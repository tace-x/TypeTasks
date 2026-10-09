import { useEffect, useState } from "react";
import { Check, Maximize2, Minimize2, Pause, Play, RotateCcw, X, Sparkles } from "lucide-react";
import type { Task } from "../../model";
import { triggerConfetti } from "../lib/confetti";
import { playCompleteSound, playTimerFinishSound } from "../lib/sound";

interface ZenModalProps {
  open: boolean;
  tasks: Task[];
  duration: number;
  onClose: () => void;
  onTaskComplete: (task: Task) => void;
}

export default function ZenModal({
  open,
  tasks,
  duration,
  onClose,
  onTaskComplete,
}: ZenModalProps) {
  const [remaining, setRemaining] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeTask = tasks.find((t) => t.status !== "done");

  useEffect(() => {
    if (open) {
      setRemaining(duration * 60);
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [open, duration]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRunning(false);
          playTimerFinishSound();
          triggerConfetti();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setRunning((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const total = duration * 60;
  const progress = total > 0 ? (total - remaining) / total : 0;
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const circumference = 2 * Math.PI * 120;

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  return (
    <div className="zen-modal-overlay">
      <div className="zen-ambient-mesh" />
      <div className="zen-topbar">
        <div className="zen-badge">
          <Sparkles size={14} />
          <span>Deep Focus Mode</span>
        </div>
        <div className="zen-actions">
          <button className="zen-btn-icon" onClick={toggleFullscreen} title="Toggle fullscreen">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button className="zen-btn-icon" onClick={onClose} title="Exit (Esc)">
            <X size={19} />
          </button>
        </div>
      </div>

      <div className="zen-center">
        <div className={`zen-clock-container ${running ? "is-breathing" : ""}`}>
          <svg className="zen-clock-svg" viewBox="0 0 280 280">
            <defs>
              <linearGradient id="zenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle className="zen-ring-track" cx="140" cy="140" r="120" />
            <circle
              className="zen-ring-progress"
              cx="140"
              cy="140"
              r="120"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          <div className="zen-clock-inner">
            <span className="zen-timer-digits">
              {minutes}:{seconds}
            </span>
            <span className="zen-timer-state">
              {remaining === 0 ? "Session Complete!" : running ? "Stay in flow" : "Paused"}
            </span>
          </div>
        </div>

        {activeTask && (
          <div className="zen-task-card">
            <div className="zen-task-left">
              <button
                className="zen-task-check"
                title="Mark complete"
                onClick={() => {
                  playCompleteSound();
                  triggerConfetti();
                  onTaskComplete(activeTask);
                }}
              >
                <Check size={16} strokeWidth={2.5} />
              </button>
              <div className="zen-task-details">
                <span className="zen-task-title">{activeTask.title}</span>
                {activeTask.project && <span className="zen-task-tag">{activeTask.project}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="zen-controls">
          <button
            className="zen-ctrl-btn zen-primary-btn"
            onClick={() => setRunning((prev) => !prev)}
          >
            {running ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            <span>{running ? "Pause" : remaining === 0 ? "Restart" : "Resume"}</span>
          </button>
          <button
            className="zen-ctrl-btn zen-secondary-btn"
            onClick={() => {
              setRemaining(duration * 60);
              setRunning(false);
            }}
            title="Reset"
          >
            <RotateCcw size={17} />
          </button>
        </div>

        <div className="zen-hint">
          <span>Press <kbd>Space</kbd> to toggle, <kbd>Esc</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
}
