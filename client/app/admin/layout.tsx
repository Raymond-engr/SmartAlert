"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "admin") {
      router.replace("/" + user.role + "/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.955 0.012 83)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Desktop */}
      <div
        style={{
          width: "100%",
          maxWidth: 1240,
          height: 782,
          background: "oklch(0.99 0.01 83)",
          border: "1px solid oklch(0.82 0.014 78)",
          borderRadius: 6,
          boxShadow: "0 24px 60px oklch(0.24 0.03 55 / 0.12)",
          overflow: "hidden",
          display: "flex",
        }}
        className="hidden lg:flex"
      >
        <Sidebar user={user} alertCount={0} />
        <main
          style={{
            flex: 1,
            overflow: "auto",
            background: "oklch(0.955 0.012 83)",
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile */}
      <div
        style={{
          width: 390,
          maxHeight: 800,
          background: "oklch(0.99 0.01 83)",
          borderRadius: 40,
          boxShadow: "0 28px 64px oklch(0.24 0.04 55 / 0.22)",
          border: "8px solid oklch(0.22 0.014 55)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        className="flex lg:hidden"
      >
        <MobileHeader user={user} alertCount={0} greeting="GOOD MORNING" />
        <main
          style={{
            flex: 1,
            overflow: "auto",
            background: "oklch(0.955 0.012 83)",
          }}
        >
          {children}
        </main>
        <MobileBottomNav user={user} alertCount={0} />
      </div>
    </div>
  );
}
