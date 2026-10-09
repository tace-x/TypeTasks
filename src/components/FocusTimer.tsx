import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, RotateCcw, Timer } from "lucide-react";
import type { Task } from "../../model";
import { triggerConfetti } from "../lib/confetti";
import { playPopSound, playTimerFinishSound } from "../lib/sound";

interface FocusTimerProps {
  tasks: Task[];
  duration: number;
  onDurationChange?: (minutes: number) => void;
  onOpenZen?: () => void;
  onComplete: () => void;
}

export default function FocusTimer({
  tasks,
  duration,
  onDurationChange,
  onOpenZen,
  onComplete,
}: FocusTimerProps) {
  const [remaining, setRemaining] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<number | "">("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setRemaining(duration * 60);
    setRunning(false);
    setFinished(false);
  }, [duration]);

  useEffect(() => {
    if (focusTaskId !== "" && !tasks.some((task) => task.id === focusTaskId && task.status !== "done")) {
      setFocusTaskId("");
    }
  }, [focusTaskId, tasks]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running || remaining !== 0) return;
    setRunning(false);
    setFinished(true);
    playTimerFinishSound();
    triggerConfetti();
    onCompleteRef.current();
  }, [remaining, running]);

  const totalSeconds = duration * 60;
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - remaining) / totalSeconds;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  function reset() {
    playPopSound();
    setRunning(false);
    setFinished(false);
    setRemaining(totalSeconds);
  }

  function handleTogglePlay() {
    playPopSound();
    if (remaining === 0) reset();
    else {
      setFinished(false);
      setRunning((value) => !value);
    }
  }

  return (
    <section className="panel focus-panel" aria-labelledby="focus-panel-title">
      <div className="panel-heading focus-panel-heading">
        <div>
          <span className="eyebrow">MAKE SPACE</span>
          <h2 id="focus-panel-title">Focus session</h2>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {onOpenZen && (
            <button
              className="icon-button"
              type="button"
              onClick={() => {
                playPopSound();
                onOpenZen();
              }}
              title="Open full-screen Zen mode"
              aria-label="Open full-screen Zen mode"
            >
              <Maximize2 size={15} />
            </button>
          )}
          <span className="focus-icon"><Timer size={17} /></span>
        </div>
      </div>

      {onDurationChange && (
        <div style={{ display: "flex", gap: "6px", margin: "10px 0 4px", justifyContent: "center" }}>
          {[15, 25, 50].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                playPopSound();
                onDurationChange(mins);
              }}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: duration === mins ? "700" : "500",
                color: duration === mins ? "var(--accent)" : "var(--muted)",
                background: duration === mins ? "var(--accent-soft)" : "transparent",
                border: "1px solid",
                borderColor: duration === mins ? "var(--accent)" : "var(--line)",
                cursor: "pointer",
                transition: "all 0.14s ease",
              }}
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      <div className="focus-clock-wrap">
        <svg className="focus-ring" viewBox="0 0 160 160" aria-hidden="true">
          <circle className="focus-ring-track" cx="80" cy="80" r="68" />
          <circle
            className="focus-ring-progress"
            cx="80"
            cy="80"
            r="68"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className="focus-clock" aria-live="off">
          <strong>{minutes}:{seconds}</strong>
          <span>{finished ? "Complete" : running ? "In focus" : "Ready"}</span>
        </div>
      </div>

      <label className="focus-task-label" htmlFor="focus-task">Working on</label>
      <select
        id="focus-task"
        className="focus-task-select"
        value={focusTaskId}
        onChange={(event) => setFocusTaskId(event.target.value ? Number(event.target.value) : "")}
      >
        <option value="">Choose a task (optional)</option>
        {tasks.filter((task) => task.status !== "done").map((task) => (
          <option key={task.id} value={task.id}>{task.title}</option>
        ))}
      </select>

      <div className="focus-controls">
        <button
          className="button button-primary focus-start-button"
          type="button"
          onClick={handleTogglePlay}
        >
          {running ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          {running ? "Pause" : finished ? "Start again" : "Start focus"}
        </button>
        <button className="icon-button focus-reset" type="button" onClick={reset} aria-label="Reset focus timer" title="Reset timer">
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="focus-caption">A small block of attention can move a lot forward.</p>
    </section>
  );
}
