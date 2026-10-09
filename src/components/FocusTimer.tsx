import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import type { Task } from "../../model";

interface FocusTimerProps {
  tasks: Task[];
  duration: number;
  onComplete: () => void;
}

export default function FocusTimer({ tasks, duration, onComplete }: FocusTimerProps) {
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
    onCompleteRef.current();
  }, [remaining, running]);

  const totalSeconds = duration * 60;
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - remaining) / totalSeconds;
  const circumference = 2 * Math.PI * 45;
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  function reset() {
    setRunning(false);
    setFinished(false);
    setRemaining(totalSeconds);
  }

  return (
    <section className="panel focus-panel" aria-labelledby="focus-panel-title">
      <div className="panel-heading focus-panel-heading">
        <div>
          <span className="eyebrow">MAKE SPACE</span>
          <h2 id="focus-panel-title">Focus session</h2>
        </div>
        <span className="focus-icon"><Timer size={17} /></span>
      </div>

      <div className="focus-clock-wrap">
        <svg className="focus-ring" viewBox="0 0 112 112" aria-hidden="true">
          <circle className="focus-ring-track" cx="56" cy="56" r="45" />
          <circle
            className="focus-ring-progress"
            cx="56"
            cy="56"
            r="45"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className="focus-clock" aria-live="off">
          <strong>{minutes}:{seconds}</strong>
          <span>{finished ? "complete" : running ? "in focus" : "ready when you are"}</span>
        </div>
      </div>

      <label className="focus-task-label" htmlFor="focus-task">Working on</label>
      <select id="focus-task" className="focus-task-select" value={focusTaskId} onChange={(event) => setFocusTaskId(event.target.value ? Number(event.target.value) : "")}>
        <option value="">Choose a task (optional)</option>
        {tasks.filter((task) => task.status !== "done").map((task) => (
          <option key={task.id} value={task.id}>{task.title}</option>
        ))}
      </select>

      <div className="focus-controls">
        <button className="button button-primary focus-start-button" type="button" onClick={() => {
          if (remaining === 0) reset();
          else {
            setFinished(false);
            setRunning((value) => !value);
          }
        }}>
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
