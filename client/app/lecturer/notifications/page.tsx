import { StatusChip } from "@/components/StatusChip";
import { getStatusColor } from "@/lib/utils";
import type { Alert } from "@/types";

const ALERTS: Alert[] = [
  {
    id: "1",
    courseCode: "CSC 305",
    courseName: "Database Systems",
    status: "cancelled",
    message: "You cancelled the Friday 08:00 session. 23 students were notified.",
    timestamp: "Fri · 07:40",
    unread: false,
  },
  {
    id: "2",
    courseCode: "CSC 401",
    courseName: "Software Engineering",
    status: "live",
    message: "Your Monday 10:00 session started and is now in progress.",
    timestamp: "Today · 10:01",
    unread: false,
  },
];

export default function LecturerNotifications() {
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
      <p style={{ fontSize: 14, color: "oklch(0.5 0.012 55)", marginBottom: 22 }}>
        A log of session changes you&apos;ve made and their notification status.
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
              borderBottom: i < ALERTS.length - 1 ? "1px solid oklch(0.9 0.012 80)" : "none",
            }}
          >
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
                  }}
                >
                  {alert.timestamp}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "oklch(0.42 0.012 55)", lineHeight: 1.5 }}>
                {alert.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
