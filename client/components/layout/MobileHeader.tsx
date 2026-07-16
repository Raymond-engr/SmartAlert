"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import type { AppUser } from "@/types";

interface MobileHeaderProps {
  user: AppUser;
  alertCount?: number;
  greeting?: string;
}

export function MobileHeader({
  user,
  alertCount,
  greeting = "GOOD MORNING",
}: MobileHeaderProps) {
  return (
    <header
      style={{
        padding: "15px 18px 10px",
        borderBottom: "1px solid oklch(0.88 0.014 80)",
        background: "oklch(0.99 0.007 83)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 4,
            background: "oklch(0.955 0.012 83)",
            border: "1px solid oklch(0.85 0.014 78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontWeight: 600,
            fontSize: 13,
            color: "oklch(0.24 0.014 55)",
            flexShrink: 0,
          }}
        >
          {user.initials}
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.6 0.01 55)",
            }}
          >
            {greeting}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "oklch(0.24 0.014 55)",
            }}
          >
            {user.firstName}
          </div>
        </div>
      </div>

      <Link
        href={`/${user.role}/notifications`}
        style={{
          position: "relative",
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid oklch(0.86 0.014 78)",
          borderRadius: 3,
          background: "transparent",
          color: "oklch(0.46 0.012 55)",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <Bell size={17} />
        {alertCount ? (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 9,
              fontWeight: 600,
              background: "oklch(0.55 0.2 27)",
              color: "oklch(0.98 0.01 83)",
              borderRadius: 2,
              padding: "0 4px",
              lineHeight: "16px",
              minWidth: 16,
              textAlign: "center",
            }}
          >
            {alertCount}
          </span>
        ) : null}
      </Link>
    </header>
  );
}
