"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  return (
    <div style={{ padding: "28px 32px", maxWidth: 560, display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", color: "oklch(0.24 0.014 55)", marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: "oklch(0.5 0.012 55)" }}>
          Manage administrator account details.
        </p>
      </div>

      <div
        style={{
          padding: 18,
          background: "oklch(0.99 0.007 83)",
          border: "1px solid oklch(0.86 0.014 78)",
          borderRadius: 5,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 54, height: 54, borderRadius: 4,
            background: "oklch(0.955 0.012 83)",
            border: "1px solid oklch(0.85 0.014 78)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontWeight: 600, fontSize: 19,
            color: "oklch(0.24 0.014 55)",
            flexShrink: 0,
          }}
        >
          SA
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "oklch(0.24 0.014 55)" }}>Sarah Adeola</div>
          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "oklch(0.6 0.01 55)" }}>
            ADMIN · CSC
          </div>
        </div>
      </div>

      <div>
        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "oklch(0.55 0.012 55)", marginBottom: 10 }}>
          Profile
        </p>
        <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: 5, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Label htmlFor="a-name">Full name</Label>
            <Input id="a-name" defaultValue="Sarah Adeola" />
          </div>
          <div>
            <Label htmlFor="a-email">Email</Label>
            <Input id="a-email" defaultValue="sarah@uniben.edu.ng" type="email" />
          </div>
        </div>
      </div>

      <Button variant="primary" size="default" style={{ alignSelf: "flex-start" }}>
        Save changes
      </Button>
    </div>
  );
}
