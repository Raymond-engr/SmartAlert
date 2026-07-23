"use client";

import { useEffect, useRef, useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import { getStatusColor, formatAlertTimestamp } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import type { Alert } from "@/types";

export default function StudentNotifications() {
  const { alerts, markAllRead } = useNotifications();
  const [snapshot, setSnapshot] = useState<Alert[] | null>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    if (snapshot === null && alerts.length > 0) {
      setSnapshot(alerts);
    }
  }, [alerts, snapshot]);

  useEffect(() => {
    if (!markedRef.current) {
      markedRef.current = true;
      markAllRead();
    }
  }, [markAllRead]);

  const displayAlerts = snapshot ?? alerts;

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
        {displayAlerts.map((alert, i) => (
          <div
            key={alert.id}
            style={{
              display: "flex",
              gap: 14,
              padding: "15px 16px",
              borderBottom:
                i < displayAlerts.length - 1
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
                  {formatAlertTimestamp(alert.createdAt)}
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
