"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function LecturerSettings() {
  const [email, setEmail] = useState(true);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 560, display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", color: "oklch(0.24 0.014 55)", marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: "oklch(0.5 0.012 55)" }}>
          Manage your profile and notification preferences.
        </p>
      </div>

      {/* Profile card */}
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
          EO
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "oklch(0.24 0.014 55)" }}>
            Emmanuel Okoro
          </div>
          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "oklch(0.6 0.01 55)" }}>
            LECTURER · CSC
          </div>
        </div>
      </div>

      {/* Profile fields */}
      <div>
        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "oklch(0.55 0.012 55)", marginBottom: 10 }}>
          Profile
        </p>
        <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: 5, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Label htmlFor="l-name">Full name</Label>
            <Input id="l-name" defaultValue="Emmanuel Okoro" />
          </div>
          <div>
            <Label htmlFor="l-email">University email</Label>
            <Input id="l-email" defaultValue="emmanuel@uniben.edu.ng" type="email" />
          </div>
          <div>
            <Label htmlFor="l-dept">Department</Label>
            <Input id="l-dept" defaultValue="Computer Science" readOnly style={{ background: "oklch(0.955 0.012 83)" }} />
          </div>
        </div>
      </div>

      {/* Alert channels */}
      <div>
        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "oklch(0.55 0.012 55)", marginBottom: 10 }}>
          Alert Channels
        </p>
        <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 18px" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.24 0.014 55)" }}>Email notifications</div>
              <div style={{ fontSize: 12, color: "oklch(0.55 0.012 55)", marginTop: 2 }}>Receive a summary when students are alerted about your session changes</div>
            </div>
            <Switch checked={email} onCheckedChange={setEmail} />
          </div>
        </div>
      </div>

      <Button variant="primary" size="default" style={{ alignSelf: "flex-start" }}>
        Save changes
      </Button>
    </div>
  );
}
