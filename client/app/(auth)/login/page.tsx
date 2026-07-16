"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const PANEL_FEATURES = [
  {
    dot: "oklch(0.62 0.13 152)",
    text: "Real-time cancellation alerts via in-app push and email",
  },
  {
    dot: "oklch(0.68 0.14 66)",
    text: "Instant reschedule notifications with updated venue & time",
  },
  {
    dot: "oklch(0.6 0.16 41)",
    text: "Your personal timetable, always in sync",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 940,
        background: "oklch(0.99 0.007 83)",
        border: "1px solid oklch(0.82 0.014 78)",
        borderRadius: 6,
        boxShadow: "0 24px 60px oklch(0.24 0.03 55 / 0.12)",
        overflow: "hidden",
        display: "flex",
        minHeight: 560,
      }}
    >
      {/* Brand panel */}
      <div
        style={{
          width: "44%",
          flexShrink: 0,
          background: "oklch(0.26 0.02 52)",
          backgroundImage:
            "repeating-linear-gradient(0deg, oklch(0.93 0.012 83 / 0.045) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, oklch(0.93 0.012 83 / 0.05) 0 1px, transparent 1px 34px)",
          padding: "32px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 40,
          }}
        >
          <LogoMark size={24} dark />
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "oklch(0.93 0.012 83)",
            }}
          >
            SmartAlert
          </span>
        </div>

        {/* Headline */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.68 0.14 45)",
              marginBottom: 14,
            }}
          >
            Live timetable · UNIBEN
          </p>
          <h1
            style={{
              fontSize: 33,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              color: "oklch(0.93 0.012 83)",
              marginBottom: 20,
            }}
          >
            Never miss a class change again.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "oklch(0.82 0.012 83 / 0.85)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            SmartAlert replaces WhatsApp groups and notice boards with a
            single, always-current schedule for every student.
          </p>

          {/* Feature list */}
          <div
            style={{
              border: "1px solid oklch(0.93 0.012 83 / 0.14)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {PANEL_FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "13px 15px",
                  borderBottom:
                    i < PANEL_FEATURES.length - 1
                      ? "1px solid oklch(0.93 0.012 83 / 0.14)"
                      : "none",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: f.dot,
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: "oklch(0.82 0.012 83 / 0.85)",
                    lineHeight: 1.5,
                  }}
                >
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "oklch(0.82 0.012 83 / 0.72)",
            marginTop: 32,
          }}
        >
          Faculty of Physical Sciences · Dept. of Computer Science
        </p>
      </div>

      {/* Form side */}
      <div
        style={{
          flex: 1,
          padding: "48px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Mobile-only logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 28,
          }}
          className="flex md:hidden"
        >
          <LogoMark size={24} />
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "oklch(0.24 0.014 55)",
            }}
          >
            SmartAlert
          </span>
        </div>

        <h2
          style={{
            fontSize: 27,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "oklch(0.24 0.014 55)",
            marginBottom: 6,
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "oklch(0.5 0.012 55)",
            marginBottom: 28,
          }}
        >
          Sign in to see your up-to-date lecture schedule.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <Label htmlFor="email">University email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@uniben.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <Label htmlFor="password" style={{ marginBottom: 0 }}>
                Password
              </Label>
              <a
                href="#"
                style={{
                  fontSize: 13,
                  color: "oklch(0.52 0.16 41)",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Demo sign-in section */}
          <div style={{ marginTop: 4 }}>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "oklch(0.6 0.01 55)",
                marginBottom: 10,
              }}
            >
              Sign in as (demo)
            </p>

            <Button
              variant="primary"
              size="full"
              onClick={() => router.push("/student/dashboard")}
              style={{ marginBottom: 8 }}
            >
              Sign in as Student
            </Button>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="ghost"
                size="full"
                onClick={() => router.push("/lecturer/dashboard")}
              >
                Lecturer
              </Button>
              <Button
                variant="ghost"
                size="full"
                onClick={() => router.push("/admin/dashboard")}
              >
                Admin
              </Button>
            </div>
          </div>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "oklch(0.5 0.012 55)",
            marginTop: 24,
          }}
        >
          New here?{" "}
          <Link
            href="/register"
            style={{ color: "oklch(0.52 0.16 41)", textDecoration: "none" }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
