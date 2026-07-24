import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Session, SessionStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message ?? fallback
  );
}

export function getStatusColor(status: SessionStatus): string {
  switch (status) {
    case "ongoing":
      return "oklch(0.55 0.13 152)";
    case "rescheduled":
      return "oklch(0.58 0.14 64)";
    case "cancelled":
      return "oklch(0.55 0.2 27)";
    case "completed":
      return "oklch(0.62 0.01 55)";
    default:
      return "oklch(0.5 0.012 55)";
  }
}

export function getStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "ongoing":
      return "Live";
    case "rescheduled":
      return "Moved";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Done";
    default:
      return "Scheduled";
  }
}

export function getSessionNote(s: Session): string | undefined {
  switch (s.status) {
    case "rescheduled":
      return `Now ${s.startTime}–${s.endTime} · ${s.venue}`;
    case "cancelled":
      return `Cancelled · ${s.venue}`;
    case "ongoing":
      return `In progress · ${s.venue}`;
    case "completed":
      return `Done · ${s.venue}`;
    default:
      return undefined;
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatAlertTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatAlertTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = formatAlertTime(iso);
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return `Today · ${time}`;
  }

  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} · ${time}`;
}

export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
