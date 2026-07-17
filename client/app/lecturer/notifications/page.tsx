"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { getStatusColor, formatAlertTimestamp } from "@/lib/utils";
import { api } from "@/lib/api";
import { useSessions } from "@/hooks/useSessions";
import type { Alert } from "@/types";

export default function LecturerNotifications() {
  const { sessions } = useSessions();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // A lecturer's alert feed is per-course; derive the distinct courses they
  // teach from their own sessions rather than calling GET /courses, since
  // useSessions() is already role-scoped to exactly the right set.
  const courseIds = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.courseId))),
    [sessions]
  );

  useEffect(() => {
    if (courseIds.length === 0) {
      setAlerts([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      courseIds.map((id) =>
        api.get<{ success: boolean; data: Alert[] }>(`/notifications/course/${id}`)
      )
    ).then((responses) => {
      if (cancelled) return;
      const combined = responses.flatMap((r) => r.data.data);
      combined.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAlerts(combined);
    });
    return () => {
      cancelled = true;
    };
  }, [courseIds]);

  return (
    <div style={{ maxWidth: 720 }} className="px-4 py-6 lg:px-8 lg:py-7">
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
        {alerts.map((alert, i) => (
          <div
            key={alert.id}
            style={{
              display: "flex",
              gap: 14,
              padding: "15px 16px",
              borderBottom: i < alerts.length - 1 ? "1px solid oklch(0.9 0.012 80)" : "none",
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
                  {formatAlertTimestamp(alert.createdAt)}
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
