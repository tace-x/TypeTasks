import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, Moon, RotateCcw, Sun, Upload, Volume2, VolumeX, X } from "lucide-react";
import type { Task } from "../../model";
import { parseTaskList } from "../lib/tasks";
import { playPopSound } from "../lib/sound";

export type AppTheme = "light" | "dark";

interface SettingsDialogProps {
  open: boolean;
  theme: AppTheme;
  focusDuration: number;
  onClose: () => void;
  onThemeChange: (theme: AppTheme) => void;
  onFocusDurationChange: (minutes: number) => void;
  onExport: () => void;
  onImport: (tasks: Task[]) => void;
  onReset: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function SettingsDialog({
  open,
  theme,
  focusDuration,
  onClose,
  onThemeChange,
  onFocusDurationChange,
  onExport,
  onImport,
  onReset,
  soundEnabled = true,
  onToggleSound,
}: SettingsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const tasks = parseTaskList(parsed);
      if (!tasks) throw new Error("That file does not look like a TypeTasks export.");
      onImport(tasks);
      setImportError("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not read that file.");
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="settings-dialog modal-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h2 id="settings-title">Settings & Preferences</h2>
          </div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-copy">
            <h3>Appearance</h3>
            <p>Choose between clean studio light and high-end obsidian dark.</p>
          </div>
          <div className="theme-switch" role="group" aria-label="Appearance">
            <button
              className={theme === "light" ? "selected" : ""}
              onClick={() => {
                playPopSound();
                onThemeChange("light");
              }}
              type="button"
            >
              <Sun size={15} /> Light
            </button>
            <button
              className={theme === "dark" ? "selected" : ""}
              onClick={() => {
                playPopSound();
                onThemeChange("dark");
              }}
              type="button"
            >
              <Moon size={15} /> Dark
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-copy">
            <h3>Audio feedback</h3>
            <p>Crisp mechanical clicks and harmonic task completion bells.</p>
          </div>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              playPopSound();
              if (onToggleSound) onToggleSound();
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? "Sound enabled" : "Muted"}</span>
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-copy">
            <h3>Focus session</h3>
            <p>Set the default duration of your quiet deep work blocks.</p>
          </div>
          <select
            className="settings-select"
            value={focusDuration}
            onChange={(event) => {
              playPopSound();
              onFocusDurationChange(Number(event.target.value));
            }}
            aria-label="Focus session length"
          >
            <option value={15}>15 minutes</option>
            <option value={25}>25 minutes (Pomodoro)</option>
            <option value={50}>50 minutes (Deep Work)</option>
          </select>
        </div>

        <div className="settings-section settings-data-section">
          <div className="settings-copy">
            <h3>Your task data</h3>
            <p>Tasks stay safely stored in this browser. Export a JSON backup or restore anytime.</p>
          </div>
          <div className="settings-data-actions">
            <button className="button button-quiet" type="button" onClick={() => { playPopSound(); onExport(); }}>
              <Download size={15} /> Export JSON
            </button>
            <button className="button button-quiet" type="button" onClick={() => { playPopSound(); fileInputRef.current?.click(); }}>
              <Upload size={15} /> Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={importFile} hidden />
          </div>
          {importError && <p className="inline-error" role="alert">{importError}</p>}
        </div>

        <div className="settings-reset-row">
          <div>
            <strong>Restore sample workspace</strong>
            <span>Reset your workspace with beautifully crafted sample tasks.</span>
          </div>
          <button className="button button-danger-quiet" type="button" onClick={() => { playPopSound(); onReset(); }}>
            <RotateCcw size={15} /> Restore
          </button>
        </div>

        <p className="settings-footnote">TypeTasks runs locally in your browser with zero telemetry. Fast, private, resilient.</p>
      </section>
    </div>
  );
}
