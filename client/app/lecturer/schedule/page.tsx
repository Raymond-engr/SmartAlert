"use client";

import { useMemo } from "react";
import { StatusChip } from "@/components/StatusChip";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/hooks/useSessions";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const PANEL_STYLE = {
  background: "oklch(0.99 0.007 83)",
  border: "1px solid oklch(0.86 0.014 78)",
  borderRadius: 5,
  overflow: "hidden",
} as const;

export default function LecturerSchedulePage() {
  const { user } = useAuth();
  // scope: "all" lifts the normal "only your courses" filter so the whole
  // campus timetable comes back — read-only, purely to spot a free slot.
  const { sessions, loading } = useSessions({ scope: "all" });

  const byDay = useMemo(() => {
    return DAY_ORDER.map((day) => ({
      day,
      items: sessions
        .filter((s) => s.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })).filter((row) => row.items.length > 0 || DAY_ORDER.indexOf(row.day) < 5);
  }, [sessions]);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-7">
      <h1
        style={{
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "oklch(0.24 0.014 55)",
          marginBottom: 4,
        }}
      >
        Master schedule
      </h1>
      <p style={{ fontSize: 14, color: "oklch(0.5 0.012 55)", marginBottom: 24 }}>
        The full campus timetable, read-only. Use it to find a free venue and
        time slot before rescheduling one of your sessions — anything not
        listed on a given day is open.
      </p>

      {loading ? (
        <p style={{ fontSize: 13, color: "oklch(0.6 0.01 55)" }}>Loading…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {byDay.map(({ day, items }) => (
            <div key={day}>
              <h2
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "oklch(0.55 0.012 55)",
                  marginBottom: 8,
                }}
              >
                {day}
              </h2>
              <div style={PANEL_STYLE}>
                {items.length === 0 ? (
                  <div style={{ padding: "14px 16px", fontSize: 13, color: "oklch(0.6 0.01 55)" }}>
                    Nothing scheduled — fully open.
                  </div>
                ) : (
                  items.map((s, i) => {
                    const isMine = s.lecturer === user?.name;
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "12px 16px",
                          borderBottom:
                            i < items.length - 1
                              ? "1px solid oklch(0.9 0.012 80)"
                              : "none",
                          background: isMine
                            ? "oklch(0.94 0.03 50 / 0.4)"
                            : "transparent",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            color: "oklch(0.46 0.012 55)",
                            width: 100,
                            flexShrink: 0,
                          }}
                        >
                          {s.startTime}–{s.endTime}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "oklch(0.24 0.014 55)",
                            width: 66,
                            flexShrink: 0,
                          }}
                        >
                          {s.courseCode}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "oklch(0.34 0.014 55)",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.courseName}
                          {isMine && (
                            <span
                              style={{
                                fontFamily: "var(--font-ibm-plex-mono), monospace",
                                fontSize: 10,
                                fontWeight: 600,
                                color: "oklch(0.55 0.16 41)",
                                marginLeft: 8,
                              }}
                            >
                              YOURS
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            color: "oklch(0.5 0.012 55)",
                            width: 130,
                            flexShrink: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.lecturer ?? "—"}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "oklch(0.46 0.012 55)",
                            width: 60,
                            flexShrink: 0,
                          }}
                        >
                          {s.venue}
                        </span>
                        <span style={{ flexShrink: 0 }}>
                          <StatusChip status={s.status} />
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}