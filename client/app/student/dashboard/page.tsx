"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import { getStatusColor } from "@/lib/utils";
import type { Session, Alert } from "@/types";

const TODAY_SESSIONS: Session[] = [
  {
    id: "1",
    courseCode: "CSC 305",
    courseName: "Database Systems",
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    venue: "LT3",
    status: "done",
    note: "Done · LT3",
  },
  {
    id: "2",
    courseCode: "CSC 401",
    courseName: "Software Engineering",
    day: "Monday",
    startTime: "10:00",
    endTime: "12:00",
    venue: "LT1",
    status: "live",
    lecturer: "Dr. Okoro",
    note: "In progress · LT1",
  },
  {
    id: "3",
    courseCode: "MTH 301",
    courseName: "Calculus III",
    day: "Monday",
    startTime: "12:00",
    endTime: "14:00",
    venue: "LH2",
    status: "moved",
    note: "Now 14:00–16:00 · LH2",
  },
  {
    id: "4",
    courseCode: "CSC 403",
    courseName: "Operating Systems",
    day: "Monday",
    startTime: "14:00",
    endTime: "16:00",
    venue: "LT2",
    status: "cancelled",
    note: "Cancelled · LT2",
  },
  {
    id: "5",
    courseCode: "CSC 407",
    courseName: "Computer Networks",
    day: "Monday",
    startTime: "16:00",
    endTime: "18:00",
    venue: "LT1",
    status: "scheduled",
  },
];

const WEEK_SESSIONS = [
  {
    day: "MON",
    isToday: true,
    items: [
      { code: "CSC 305", time: "08:00–10:00", name: "Database Systems", status: "done" as const },
      { code: "CSC 401", time: "10:00–12:00", name: "Software Engineering", status: "live" as const },
      { code: "CSC 403", time: "14:00–16:00", name: "Operating Systems", status: "cancelled" as const },
    ],
  },
  {
    day: "TUE",
    isToday: false,
    items: [
      { code: "MTH 301", time: "10:00–12:00", name: "Calculus III", status: "scheduled" as const },
      { code: "CSC 407", time: "14:00–16:00", name: "Computer Networks", status: "scheduled" as const },
    ],
  },
  {
    day: "WED",
    isToday: false,
    items: [
      { code: "CSC 401", time: "10:00–12:00", name: "Software Engineering", status: "scheduled" as const },
      { code: "CSC 305", time: "14:00–16:00", name: "Database Systems", status: "scheduled" as const },
    ],
  },
  {
    day: "THU",
    isToday: false,
    items: [
      { code: "MTH 301", time: "08:00–10:00", name: "Calculus III", status: "scheduled" as const },
    ],
  },
  {
    day: "FRI",
    isToday: false,
    items: [
      { code: "CSC 407", time: "10:00–12:00", name: "Computer Networks", status: "scheduled" as const },
      { code: "CSC 409", time: "14:00–16:00", name: "Machine Learning", status: "scheduled" as const },
    ],
  },
];

const LIVE_ALERTS: Alert[] = [
  {
    id: "1",
    courseCode: "CSC 403",
    courseName: "Operating Systems",
    status: "cancelled",
    message: "Today's session has been cancelled. Dr. Adama is unavailable.",
    timestamp: "12:35",
    unread: true,
  },
  {
    id: "2",
    courseCode: "MTH 301",
    courseName: "Calculus III",
    status: "moved",
    message: "Session rescheduled to 14:00–16:00 in LH2. Same venue.",
    timestamp: "11:45",
    unread: true,
  },
  {
    id: "3",
    courseCode: "CSC 401",
    courseName: "Software Engineering",
    status: "live",
    message: "Session is now in progress in LT1. Join now.",
    timestamp: "10:03",
    unread: false,
  },
];

const PANEL_STYLE = {
  background: "oklch(0.99 0.007 83)",
  border: "1px solid oklch(0.86 0.014 78)",
  borderRadius: 5,
  overflow: "hidden",
};

export default function StudentDashboard() {
  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.6 0.01 55)",
              marginBottom: 4,
            }}
          >
            Monday, 14 July 2026
          </p>
          <h1
            style={{
              fontSize: 27,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "oklch(0.24 0.014 55)",
              margin: "4px 0",
            }}
          >
            Good morning, Harriet
          </h1>
        </div>
        <Button variant="primary" size="default" asChild>
          <Link href="/student/enroll">+ Enrol in course</Link>
        </Button>
      </div>

      {/* Two-column grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 28,
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          {/* Happening now */}
          <div
            style={{
              background: "oklch(0.26 0.02 52)",
              backgroundImage:
                "repeating-linear-gradient(0deg, oklch(0.93 0.012 83 / 0.045) 0 1px, transparent 1px 30px)",
              padding: "22px 24px",
              borderRadius: 5,
              color: "oklch(0.93 0.012 83)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                className="sa-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "oklch(0.68 0.14 152)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "oklch(0.72 0.13 152)",
                }}
              >
                Happening Now
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 12,
                color: "oklch(0.82 0.012 83 / 0.8)",
                marginBottom: 4,
              }}
            >
              CSC 401 · 10:00–12:00
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                marginBottom: 6,
              }}
            >
              Software Engineering
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "oklch(0.82 0.012 83 / 0.72)",
              }}
            >
              LT1 · Dr. Emmanuel Okoro
            </p>
          </div>

          {/* Today's classes */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "oklch(0.24 0.014 55)",
                }}
              >
                Today&apos;s classes
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: 11,
                  color: "oklch(0.6 0.01 55)",
                }}
              >
                {TODAY_SESSIONS.length} sessions
              </span>
            </div>
            <div style={PANEL_STYLE}>
              {TODAY_SESSIONS.map((s, i) => {
                const isCancelled = s.status === "cancelled";
                const color = getStatusColor(s.status);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      gap: 15,
                      padding: "14px 16px",
                      borderBottom:
                        i < TODAY_SESSIONS.length - 1
                          ? "1px solid oklch(0.9 0.012 80)"
                          : "none",
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
                    {/* Time */}
                    <div
                      style={{
                        minWidth: 52,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-ibm-plex-mono), monospace",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "oklch(0.24 0.014 55)",
                          textDecoration: isCancelled ? "line-through" : "none",
                          opacity: isCancelled ? 0.55 : 1,
                        }}
                      >
                        {s.startTime}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-ibm-plex-mono), monospace",
                          fontSize: 11,
                          color: "oklch(0.6 0.01 55)",
                        }}
                      >
                        {s.endTime}
                      </span>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 3,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            fontWeight: 500,
                            color: "oklch(0.46 0.012 55)",
                            textDecoration: isCancelled ? "line-through" : "none",
                            opacity: isCancelled ? 0.55 : 1,
                          }}
                        >
                          {s.courseCode}
                        </span>
                        <StatusChip status={s.status} />
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "oklch(0.24 0.014 55)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: 2,
                          textDecoration: isCancelled ? "line-through" : "none",
                          opacity: isCancelled ? 0.55 : 1,
                        }}
                      >
                        {s.courseName}
                      </p>
                      {s.note && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "oklch(0.55 0.012 55)",
                          }}
                        >
                          {s.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* This week */}
          <div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "oklch(0.24 0.014 55)",
                marginBottom: 10,
              }}
            >
              This week
            </h2>
            <div style={PANEL_STYLE}>
              {WEEK_SESSIONS.map((row, ri) => (
                <div
                  key={row.day}
                  style={{
                    display: "flex",
                    borderBottom:
                      ri < WEEK_SESSIONS.length - 1
                        ? "1px solid oklch(0.9 0.012 80)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 76,
                      padding: "14px 16px",
                      borderRight: "1px solid oklch(0.9 0.012 80)",
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: row.isToday
                        ? "oklch(0.55 0.16 41)"
                        : "oklch(0.6 0.01 55)",
                      display: "flex",
                      alignItems: "flex-start",
                      flexShrink: 0,
                    }}
                  >
                    {row.day}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "9px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {row.items.map((item) => (
                      <div
                        key={item.code + item.time}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: getStatusColor(item.status),
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            color: "oklch(0.46 0.012 55)",
                            width: 92,
                            flexShrink: 0,
                          }}
                        >
                          {item.time}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: 12,
                            fontWeight: 500,
                            color: "oklch(0.46 0.012 55)",
                            width: 58,
                            flexShrink: 0,
                          }}
                        >
                          {item.code}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "oklch(0.24 0.014 55)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </span>
                        <StatusChip status={item.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — live alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "oklch(0.24 0.014 55)",
                }}
              >
                Live alerts
              </h2>
              <span
                className="sa-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "oklch(0.6 0.13 152)",
                  flexShrink: 0,
                }}
              />
            </div>
            <Link
              href="/student/notifications"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 11,
                color: "oklch(0.52 0.16 41)",
                textDecoration: "none",
              }}
            >
              See all →
            </Link>
          </div>

          <div style={PANEL_STYLE}>
            {LIVE_ALERTS.map((alert, i) => (
              <div
                key={alert.id}
                style={{
                  padding: "13px 15px",
                  borderBottom:
                    i < LIVE_ALERTS.length - 1
                      ? "1px solid oklch(0.9 0.012 80)"
                      : "none",
                  background: alert.unread
                    ? "oklch(0.94 0.03 50 / 0.5)"
                    : "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: getStatusColor(alert.status),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "oklch(0.24 0.014 55)",
                    }}
                  >
                    {alert.courseCode}
                  </span>
                  <StatusChip status={alert.status} />
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: 10,
                      color: "oklch(0.64 0.01 55)",
                      marginLeft: "auto",
                    }}
                  >
                    {alert.timestamp}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "oklch(0.42 0.012 55)",
                    lineHeight: 1.5,
                    paddingLeft: 14,
                  }}
                >
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
