# TypeTasks — Part 1

Typed  logic layer for the TypeTasks task tracker.

## Included

- `TaskStatus`: the three allowed task states
- `Task`: the typed task shape
- `addTask`: adds a new `todo` task with a unique numeric id
- `completeTask`: returns tasks with one matching task marked `done`
- `filterByStatus`: returns tasks matching a valid `TaskStatus`
- `deleteTask`: original extra operation that returns tasks without one id

## Type check

```bash
npm install
npm run typecheck
```

The project uses strict TypeScript settings and currently passes `tsc --noEmit` with zero errors.

## Deliberate type checks

These examples are intentionally not included in `model.ts` because they should fail compilation:

```ts
const missingStatus: Task = { id: 1, title: "Read" };
const stringId: Task = { id: "3", title: "Read", status: "todo" };
filterByStatus([], "finished");
```
