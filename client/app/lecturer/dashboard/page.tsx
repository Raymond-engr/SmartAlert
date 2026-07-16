"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { getStatusColor } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { Session } from "@/types";

const SESSIONS: Session[] = [
  {
    id: "1",
    courseCode: "CSC 401",
    courseName: "Software Engineering",
    day: "MONDAY",
    startTime: "10:00",
    endTime: "12:00",
    venue: "LT1",
    status: "live",
    canAct: true,
  },
  {
    id: "2",
    courseCode: "CSC 401",
    courseName: "Software Engineering",
    day: "WEDNESDAY",
    startTime: "10:00",
    endTime: "12:00",
    venue: "LT1",
    status: "scheduled",
    canAct: true,
  },
  {
    id: "3",
    courseCode: "CSC 305",
    courseName: "Database Systems",
    day: "MONDAY",
    startTime: "08:00",
    endTime: "10:00",
    venue: "LT3",
    status: "done",
    canAct: false,
  },
  {
    id: "4",
    courseCode: "CSC 305",
    courseName: "Database Systems",
    day: "FRIDAY",
    startTime: "08:00",
    endTime: "10:00",
    venue: "LT3",
    status: "cancelled",
    canAct: false,
  },
  {
    id: "5",
    courseCode: "CSC 407",
    courseName: "Computer Networks",
    day: "TUESDAY",
    startTime: "14:00",
    endTime: "16:00",
    venue: "LT2",
    status: "scheduled",
    canAct: true,
  },
];

export default function LecturerDashboard() {
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);
  const [sessions, setSessions] = useState(SESSIONS);

  function confirmCancel() {
    if (!cancelTarget) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === cancelTarget.id ? { ...s, status: "cancelled" as const, canAct: false } : s
      )
    );
    setCancelTarget(null);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 720 }}>
      <h1
        style={{
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "oklch(0.24 0.014 55)",
          marginBottom: 4,
        }}
      >
        My sessions
      </h1>
      <p style={{ fontSize: 14, color: "oklch(0.5 0.012 55)", marginBottom: 24 }}>
        Manage your scheduled lectures. Cancellations and reschedules alert
        enrolled students immediately.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sessions.map((s) => {
          const isCancelled = s.status === "cancelled";
          const color = getStatusColor(s.status);
          return (
            <div
              key={s.id}
              style={{
                background: "oklch(0.99 0.007 83)",
                border: "1px solid oklch(0.86 0.014 78)",
                borderRadius: 5,
                padding: "16px 18px",
                display: "flex",
                gap: 15,
              }}
            >
              {/* Color bar */}
              <span
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: color,
                  flexShrink: 0,
                  alignSelf: "stretch",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Code + day + status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "oklch(0.46 0.012 55)",
                    }}
                  >
                    {s.courseCode}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: "oklch(0.6 0.01 55)",
                    }}
                  >
                    {s.day}
                  </span>
                  <span style={{ marginLeft: "auto" }}>
                    <StatusChip status={s.status} />
                  </span>
                </div>

                {/* Course name */}
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "oklch(0.24 0.014 55)",
                    marginBottom: 4,
                    textDecoration: isCancelled ? "line-through" : "none",
                    opacity: isCancelled ? 0.55 : 1,
                  }}
                >
                  {s.courseName}
                </p>

                {/* Time · Venue */}
                <p
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 12,
                    color: "oklch(0.6 0.01 55)",
                    marginBottom: s.canAct ? 14 : 0,
                  }}
                >
                  {s.startTime}–{s.endTime} · {s.venue}
                </p>

                {/* Actions */}
                {s.canAct && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="moved-outline" size="sm">
                      Reschedule
                    </Button>
                    <Button
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => setCancelTarget(s)}
                    >
                      Cancel session
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "oklch(0.55 0.2 27)",
                marginBottom: 6,
              }}
            >
              Confirm cancellation
            </p>
            <DialogTitle>Cancel this session?</DialogTitle>
            {cancelTarget && (
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: 12,
                  color: "oklch(0.46 0.012 55)",
                }}
              >
                {cancelTarget.courseCode} · {cancelTarget.courseName}
              </p>
            )}
          </DialogHeader>
          <DialogDescription>
            All enrolled students will receive an in-app alert and an email
            notification immediately. This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Keep session</Button>
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={confirmCancel}>
              Cancel &amp; alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
