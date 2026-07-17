"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/StatusChip";
import { getStatusColor } from "@/lib/utils";
import { api } from "@/lib/api";
import { useSessions } from "@/hooks/useSessions";
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

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

interface RescheduleForm {
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
}

export default function LecturerDashboard() {
  const { sessions, refetch } = useSessions();
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<Session | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleForm>({
    day: "MONDAY",
    startTime: "",
    endTime: "",
    venue: "",
  });
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  function openReschedule(s: Session) {
    setRescheduleForm({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      venue: s.venue,
    });
    setRescheduleError(null);
    setRescheduleTarget(s);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api.patch(`/sessions/${cancelTarget.id}/cancel`);
      await refetch();
      setCancelTarget(null);
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "Failed to cancel session."
      );
    } finally {
      setCancelling(false);
    }
  }

  async function confirmReschedule() {
    if (!rescheduleTarget) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      await api.patch(`/sessions/${rescheduleTarget.id}/reschedule`, rescheduleForm);
      await refetch();
      setRescheduleTarget(null);
    } catch (err) {
      setRescheduleError(
        err instanceof Error ? err.message : "Failed to reschedule session."
      );
    } finally {
      setRescheduling(false);
    }
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
                    <Button
                      variant="moved-outline"
                      size="sm"
                      onClick={() => openReschedule(s)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => {
                        setCancelError(null);
                        setCancelTarget(s);
                      }}
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
          {cancelError && (
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "oklch(0.55 0.2 27)",
                marginTop: 10,
              }}
            >
              {cancelError}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Keep session</Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Cancel & alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(o) => !o && setRescheduleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "oklch(0.5 0.13 62)",
                marginBottom: 6,
              }}
            >
              Reschedule session
            </p>
            <DialogTitle>Move this session?</DialogTitle>
            {rescheduleTarget && (
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: 12,
                  color: "oklch(0.46 0.012 55)",
                }}
              >
                {rescheduleTarget.courseCode} · {rescheduleTarget.courseName}
              </p>
            )}
          </DialogHeader>
          <DialogDescription>
            All enrolled students will receive an in-app alert and an email
            notification with the new schedule.
          </DialogDescription>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <div>
              <Label>Day</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRescheduleForm((f) => ({ ...f, day: d }))}
                    style={{
                      flex: "1 0 auto",
                      padding: "9px 10px",
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.12s, border-color 0.12s",
                      border:
                        rescheduleForm.day === d
                          ? "1px solid oklch(0.55 0.16 41)"
                          : "1px solid oklch(0.82 0.014 78)",
                      background:
                        rescheduleForm.day === d
                          ? "oklch(0.94 0.03 50)"
                          : "transparent",
                      color: "oklch(0.24 0.014 55)",
                      textTransform: "capitalize",
                    }}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label htmlFor="r-start">Start time</Label>
                <Input
                  id="r-start"
                  type="time"
                  value={rescheduleForm.startTime}
                  onChange={(e) =>
                    setRescheduleForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <Label htmlFor="r-end">End time</Label>
                <Input
                  id="r-end"
                  type="time"
                  value={rescheduleForm.endTime}
                  onChange={(e) =>
                    setRescheduleForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="r-venue">Venue</Label>
              <Input
                id="r-venue"
                type="text"
                value={rescheduleForm.venue}
                onChange={(e) =>
                  setRescheduleForm((f) => ({ ...f, venue: e.target.value }))
                }
              />
            </div>
          </div>

          {rescheduleError && (
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "oklch(0.55 0.2 27)",
                marginTop: 10,
              }}
            >
              {rescheduleError}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              variant="moved-outline"
              size="sm"
              onClick={confirmReschedule}
              disabled={rescheduling}
            >
              {rescheduling ? "Rescheduling…" : "Reschedule & alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
