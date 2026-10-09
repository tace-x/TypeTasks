export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateKeyOffset(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function dateFromKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLongDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(value?: string): string {
  if (!value) return "No date";
  const date = dateFromKey(value);
  const today = localDateKey(new Date());
  const tomorrow = dateKeyOffset(1);
  const yesterday = dateKeyOffset(-1);

  if (value === today) return "Today";
  if (value === tomorrow) return "Tomorrow";
  if (value === yesterday) return "Yesterday";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateForInput(date: Date): string {
  return localDateKey(date);
}

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isWithinNextDays(value: string | undefined, days: number): boolean {
  if (!value) return false;
  const due = dateFromKey(value);
  const today = startOfLocalDay(new Date());
  const lastDay = new Date(today);
  lastDay.setDate(today.getDate() + days);
  return due >= today && due <= lastDay;
}

export function isWithinLastDays(value: string | undefined, days: number): boolean {
  if (!value) return false;
  const date = startOfLocalDay(dateFromKey(value));
  const today = startOfLocalDay(new Date());
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - Math.max(0, days - 1));
  return date >= firstDay && date <= today;
}

export function isOverdue(value: string | undefined, status?: string): boolean {
  return Boolean(value && status !== "done" && value < localDateKey(new Date()));
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function relativeDayName(date: Date): string {
  const today = startOfLocalDay(new Date()).getTime();
  const day = startOfLocalDay(date).getTime();
  const delta = Math.round((day - today) / 86_400_000);

  if (delta === 0) return "Today";
  if (delta === -1) return "Yesterday";
  if (delta === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}
