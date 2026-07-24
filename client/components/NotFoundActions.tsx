"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function NotFoundActions() {
  const { user, loading } = useAuth();

  // While the session is still being restored we don't yet know where "your
  // dashboard" is, so send them home — page.tsx forwards that to the right
  // place once auth resolves.
  const primaryHref =
    !loading && user ? `/${user.role}/dashboard` : loading ? "/" : "/login";
  const primaryLabel =
    !loading && user ? "Go to your dashboard" : "Go to sign in";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Button asChild variant="primary" size="full">
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
      <Button asChild variant="ghost" size="full">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
