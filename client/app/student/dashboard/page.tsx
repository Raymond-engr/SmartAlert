"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/StatusChip";
import {
  getStatusColor,
  getSessionNote,
  formatAlertTime,
  formatToday,
  greeting,
} from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import { useNotifications } from "@/hooks/useNotifications";

const DAY_ROWS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const DAY_NAME_BY_ROW: Record<(typeof DAY_ROWS)[number], string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

const PANEL_STYLE = {
  background: "oklch(0.99 0.007 83)",
  border: "1px solid oklch(0.86 0.014 78)",
  borderRadius: 5,
  overflow: "hidden",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { sessions } = useSessions();
  const { alerts } = useNotifications();

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const todaySessions = sessions
    .filter((s) => s.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const weekRows = DAY_ROWS.map((row) => {
    const dayName = DAY_NAME_BY_ROW[row];
    const items = sessions
      .filter((s) => s.day === dayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { day: row, isToday: dayName === todayName, items };
  }).filter((row) => row.day !== "SAT" || row.items.length > 0);

  const ongoing = todaySessions.find((s) => s.status === "ongoing");
  const now = new Date().toTimeString().slice(0, 5);
  const upNext = ongoing
    ? undefined
    : todaySessions.find((s) => s.startTime > now);
  const happening = ongoing ?? upNext;

  const liveAlerts = alerts.slice(0, 3);

  if (!user) return null;

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
            {formatToday()}
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
            {greeting()}, {user.firstName}
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
                className={ongoing ? "sa-pulse" : undefined}
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
                {ongoing ? "Happening Now" : "Up Next"}
              </span>
            </div>
            {happening ? (
              <>
                <p
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 12,
                    color: "oklch(0.82 0.012 83 / 0.8)",
                    marginBottom: 4,
                  }}
                >
                  {happening.courseCode} · {happening.startTime}–{happening.endTime}
                </p>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    marginBottom: 6,
                  }}
                >
                  {happening.courseName}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "oklch(0.82 0.012 83 / 0.72)",
                  }}
                >
                  {happening.venue}
                  {happening.lecturer ? ` · ${happening.lecturer}` : ""}
                </p>
              </>
            ) : (
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                No classes right now
              </h2>
            )}
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
                {todaySessions.length} sessions
              </span>
            </div>
            <div style={PANEL_STYLE}>
              {todaySessions.map((s, i) => {
                const isCancelled = s.status === "cancelled";
                const color = getStatusColor(s.status);
                const note = getSessionNote(s);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      gap: 15,
                      padding: "14px 16px",
                      borderBottom:
                        i < todaySessions.length - 1
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
                      {note && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "oklch(0.55 0.012 55)",
                          }}
                        >
                          {note}
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
              {weekRows.map((row, ri) => (
                <div
                  key={row.day}
                  style={{
                    display: "flex",
                    borderBottom:
                      ri < weekRows.length - 1
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
                        key={item.id}
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
                          {item.startTime}–{item.endTime}
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
                          {item.courseCode}
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
                          {item.courseName}
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
            {liveAlerts.map((alert, i) => (
              <div
                key={alert.id}
                style={{
                  padding: "13px 15px",
                  borderBottom:
                    i < liveAlerts.length - 1
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
                    {formatAlertTime(alert.createdAt)}
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
