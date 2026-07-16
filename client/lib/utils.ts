import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SessionStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: SessionStatus): string {
  switch (status) {
    case "live":
      return "oklch(0.55 0.13 152)";
    case "moved":
      return "oklch(0.58 0.14 64)";
    case "cancelled":
      return "oklch(0.55 0.2 27)";
    case "done":
      return "oklch(0.62 0.01 55)";
    default:
      return "oklch(0.5 0.012 55)";
  }
}

export function getStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "moved":
      return "Moved";
    case "cancelled":
      return "Cancelled";
    case "done":
      return "Done";
    default:
      return "Scheduled";
  }
}
