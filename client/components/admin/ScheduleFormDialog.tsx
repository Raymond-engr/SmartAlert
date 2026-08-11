"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import type { Course, Session } from "@/types";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  session?: Session | null;
  onSaved: () => void | Promise<void>;
}

const errStyle = { fontSize: 13, color: "oklch(0.55 0.2 27)" } as const;

export function ScheduleFormDialog({
  open,
  onOpenChange,
  courses,
  session,
  onSaved,
}: Props) {
  const isEdit = Boolean(session);
  const [course, setCourse] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill (or reset) the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setCourse(session?.courseId ?? "");
    setDay(session?.day ?? "Monday");
    setStartTime(session?.startTime ?? "");
    setEndTime(session?.endTime ?? "");
    setVenue(session?.venue ?? "");
  }, [open, session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (startTime && endTime && startTime >= endTime) {
      setError("Start time must be earlier than end time.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && session) {
        // Course is not editable once a session exists — cancel/reschedule
        // is how a lecturer moves an existing session, so PUT here only
        // updates day/time/venue, matching the backend's updateSessionSchema.
        await api.put(`/sessions/${session.id}`, {
          day,
          startTime,
          endTime,
          venue,
        });
      } else {
        await api.post("/sessions", { course, day, startTime, endTime, venue });
      }
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit schedule entry" : "Add to master schedule"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the day, time, or venue for this session."
              : "Add a weekly class session for a course. Students see it once enrolled; the lecturer sees it on their dashboard."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <Label htmlFor="sched-course">Course</Label>
            <Select
              id="sched-course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              disabled={isEdit}
            >
              <option value="" disabled>
                Select course
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </Select>
            {isEdit && (
              <p style={{ fontSize: 12, color: "oklch(0.6 0.01 55)", marginTop: 4 }}>
                Course can&apos;t be changed after creation. Delete and re-add
                to move a session to a different course.
              </p>
            )}
          </div>

          <div>
            <Label>Day</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
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
                      day === d
                        ? "1px solid oklch(0.55 0.16 41)"
                        : "1px solid oklch(0.82 0.014 78)",
                    background: day === d ? "oklch(0.94 0.03 50)" : "transparent",
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
              <Label htmlFor="sched-start">Start time</Label>
              <Input
                id="sched-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label htmlFor="sched-end">End time</Label>
              <Input
                id="sched-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sched-venue">Venue</Label>
            <Input
              id="sched-venue"
              type="text"
              placeholder="e.g. LT1"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          {error && <p style={errStyle}>{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting || !course}
            >
              {submitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add to schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}