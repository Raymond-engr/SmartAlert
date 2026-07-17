"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Bell,
  Settings,
  Calendar,
  Shield,
  LogOut,
} from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { useAuth } from "@/context/AuthContext";
import type { AppUser } from "@/types";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function getNavItems(user: AppUser, alertCount?: number): NavItem[] {
  switch (user.role) {
    case "student":
      return [
        {
          href: "/student/dashboard",
          icon: <LayoutDashboard size={15} />,
          label: "Dashboard",
        },
        { href: "/student/enroll", icon: <Plus size={15} />, label: "Enrol" },
        {
          href: "/student/notifications",
          icon: <Bell size={15} />,
          label: "Alerts",
          badge: alertCount,
        },
        {
          href: "/student/settings",
          icon: <Settings size={15} />,
          label: "Settings",
        },
      ];
    case "lecturer":
      return [
        {
          href: "/lecturer/dashboard",
          icon: <Calendar size={15} />,
          label: "Sessions",
        },
        {
          href: "/lecturer/notifications",
          icon: <Bell size={15} />,
          label: "Alerts",
          badge: alertCount,
        },
        {
          href: "/lecturer/settings",
          icon: <Settings size={15} />,
          label: "Settings",
        },
      ];
    case "admin":
      return [
        {
          href: "/admin/dashboard",
          icon: <Shield size={15} />,
          label: "Admin",
        },
        {
          href: "/admin/settings",
          icon: <Settings size={15} />,
          label: "Settings",
        },
      ];
  }
}

function getRoleLabel(user: AppUser): string {
  const dept = user.departmentCode;
  switch (user.role) {
    case "student":
      return `STUDENT · ${dept}`;
    case "lecturer":
      return `LECTURER · ${dept}`;
    case "admin":
      return `ADMIN · ${dept}`;
  }
}

interface SidebarProps {
  user: AppUser;
  alertCount?: number;
}

export function Sidebar({ user, alertCount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const navItems = getNavItems(user, alertCount);

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside
      style={{
        width: 236,
        flexShrink: 0,
        borderRight: "1px solid oklch(0.88 0.014 80)",
        background: "oklch(0.985 0.008 83)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo + User */}
      <div
        style={{
          padding: "22px 20px 20px",
          borderBottom: "1px solid oklch(0.88 0.014 80)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 16,
          }}
        >
          <LogoMark size={22} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "oklch(0.24 0.014 55)",
            }}
          >
            SmartAlert
          </span>
        </div>

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
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "oklch(0.24 0.014 55)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 10,
                fontWeight: 400,
                color: "oklch(0.6 0.01 55)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {getRoleLabel(user)}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}
      >
        <div
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "oklch(0.64 0.01 55)",
            padding: "0 10px 10px",
          }}
        >
          MENU
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 10px",
                borderRadius: 3,
                borderLeft: `2px solid ${isActive ? "oklch(0.55 0.16 41)" : "transparent"}`,
                background: isActive
                  ? "oklch(0.94 0.03 50)"
                  : "transparent",
                color: isActive
                  ? "oklch(0.24 0.014 55)"
                  : "oklch(0.46 0.012 55)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 2,
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span
                style={{
                  width: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? (
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    background: "oklch(0.55 0.2 27)",
                    color: "oklch(0.98 0.01 83)",
                    borderRadius: 2,
                    padding: "1px 6px",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid oklch(0.88 0.014 80)",
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "10px 10px",
            background: "transparent",
            border: "none",
            color: "oklch(0.5 0.012 55)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: 3,
            textDecoration: "none",
            transition: "background 0.12s",
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
