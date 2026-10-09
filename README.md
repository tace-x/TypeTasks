# TypeTasks

A calm, local-first, ultra-fast keyboard-first task workspace built on the typed TypeTasks engine. Designed for deep focus, quick capture, thoughtful planning, and high-performance execution.

## 🌐 Live Demo:

[https://typetask-nine.vercel.app](https://typetask-nine.vercel.app)

## Requirements

- Node.js 20.19 or newer

## Run locally

```bash
npm ci
npm run dev
```

## Verify and build

```bash
npm run typecheck
npm run test
npm run build
```

The production build is written to `dist/`. The relative asset base allows the static build to run from a project subpath as well as a domain root.

## Included

- Typed task engine with immutable create, edit, complete, status, filter, and delete operations.
- Raycast / Linear style Command Palette (<kbd>⌘K</kbd>) with search and instant action dispatching.
- Fullscreen Zen Deep Focus mode with ambient breathing ring and distraction-free timer.
- Zero-dependency procedural Web Audio API audio feedback (tactile clicks and harmonic completion chimes).
- 60fps canvas particle confetti engine for task completion celebrations.
- Responsive overview, searchable task list, and drag-and-drop board views.
- Projects, due dates, priorities, notes, filtering, sorting, and quick inline task capture.
- Local browser persistence, JSON import/export, and undo after deletion.
- Configurable focus timer, weekly progress view, keyboard shortcuts, and light/dark appearance.
- Unit tests for core engine behavior.

Tasks and preferences stay in this browser's local storage; the app does not send data to a server.
