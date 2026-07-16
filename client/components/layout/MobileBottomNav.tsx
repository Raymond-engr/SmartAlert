"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Bell,
  Settings,
  Calendar,
  Shield,
} from "lucide-react";
import type { AppUser } from "@/types";

interface MobileNavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function getMobileNavItems(
  user: AppUser,
  alertCount?: number
): MobileNavItem[] {
  switch (user.role) {
    case "student":
      return [
        {
          href: "/student/dashboard",
          icon: <LayoutDashboard size={17} />,
          label: "HOME",
        },
        { href: "/student/enroll", icon: <Plus size={17} />, label: "ENROL" },
        {
          href: "/student/notifications",
          icon: <Bell size={17} />,
          label: "ALERTS",
          badge: alertCount,
        },
        {
          href: "/student/settings",
          icon: <Settings size={17} />,
          label: "SETTINGS",
        },
      ];
    case "lecturer":
      return [
        {
          href: "/lecturer/dashboard",
          icon: <Calendar size={17} />,
          label: "SESSIONS",
        },
        {
          href: "/lecturer/notifications",
          icon: <Bell size={17} />,
          label: "ALERTS",
          badge: alertCount,
        },
        {
          href: "/lecturer/settings",
          icon: <Settings size={17} />,
          label: "SETTINGS",
        },
      ];
    case "admin":
      return [
        {
          href: "/admin/dashboard",
          icon: <Shield size={17} />,
          label: "ADMIN",
        },
        {
          href: "/admin/settings",
          icon: <Settings size={17} />,
          label: "SETTINGS",
        },
      ];
  }
}

interface MobileBottomNavProps {
  user: AppUser;
  alertCount?: number;
}

export function MobileBottomNav({ user, alertCount }: MobileBottomNavProps) {
  const pathname = usePathname();
  const navItems = getMobileNavItems(user, alertCount);

  return (
    <nav
      style={{
        height: 66,
        borderTop: "1px solid oklch(0.88 0.014 80)",
        background: "oklch(0.99 0.007 83)",
        padding: "4px 6px",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 4px",
              textDecoration: "none",
              color: isActive
                ? "oklch(0.55 0.16 41)"
                : "oklch(0.6 0.01 55)",
              position: "relative",
            }}
          >
            <span style={{ position: "relative" }}>
              {item.icon}
              {item.badge ? (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 8,
                    fontWeight: 600,
                    background: "oklch(0.55 0.2 27)",
                    color: "oklch(0.98 0.01 83)",
                    borderRadius: 2,
                    padding: "0 3px",
                    lineHeight: "14px",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
