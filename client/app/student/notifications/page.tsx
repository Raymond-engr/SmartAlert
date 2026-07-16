import { StatusChip } from "@/components/StatusChip";
import { getStatusColor } from "@/lib/utils";
import type { Alert } from "@/types";

const ALERTS: Alert[] = [
  {
    id: "1",
    courseCode: "CSC 403",
    courseName: "Operating Systems",
    status: "cancelled",
    message: "Today's 14:00 session has been cancelled. Dr. Adama is unavailable. Next session: Monday 28 July.",
    timestamp: "Today · 12:35",
    unread: true,
  },
  {
    id: "2",
    courseCode: "MTH 301",
    courseName: "Calculus III",
    status: "moved",
    message: "Today's session has been rescheduled to 14:00–16:00 in LH2. Venue unchanged.",
    timestamp: "Today · 11:45",
    unread: true,
  },
  {
    id: "3",
    courseCode: "CSC 401",
    courseName: "Software Engineering",
    status: "live",
    message: "Session is now in progress in LT1. Lecturer: Dr. Emmanuel Okoro.",
    timestamp: "Today · 10:03",
    unread: false,
  },
  {
    id: "4",
    courseCode: "CSC 305",
    courseName: "Database Systems",
    status: "moved",
    message: "Last Friday's session was moved to Monday 14 July at 08:00 in LT3.",
    timestamp: "Fri · 16:20",
    unread: false,
  },
  {
    id: "5",
    courseCode: "CSC 407",
    courseName: "Computer Networks",
    status: "cancelled",
    message: "Tuesday's session cancelled due to public holiday. Session will resume next week.",
    timestamp: "Mon · 09:00",
    unread: false,
  },
  {
    id: "6",
    courseCode: "MTH 301",
    courseName: "Calculus III",
    status: "scheduled",
    message: "Reminder: session tomorrow at 10:00 in LH2. No changes.",
    timestamp: "Sun · 20:00",
    unread: false,
  },
];

export default function StudentNotifications() {
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
        Alerts
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "oklch(0.5 0.012 55)",
          marginBottom: 22,
        }}
      >
        Every cancellation and reschedule for your enrolled courses, newest first.
      </p>

      <div
        style={{
          background: "oklch(0.99 0.007 83)",
          border: "1px solid oklch(0.86 0.014 78)",
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        {ALERTS.map((alert, i) => (
          <div
            key={alert.id}
            style={{
              display: "flex",
              gap: 14,
              padding: "15px 16px",
              borderBottom:
                i < ALERTS.length - 1
                  ? "1px solid oklch(0.9 0.012 80)"
                  : "none",
              background: alert.unread
                ? "oklch(0.94 0.03 50 / 0.5)"
                : "transparent",
            }}
          >
            {/* Color bar */}
            <span
              style={{
                width: 3,
                borderRadius: 2,
                background: getStatusColor(alert.status),
                flexShrink: 0,
                alignSelf: "stretch",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 12,
                    fontWeight: 600,
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
                    whiteSpace: "nowrap",
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
                }}
              >
                {alert.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
