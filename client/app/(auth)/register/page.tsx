"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

type Role = "student" | "lecturer";

const DEPARTMENT = "Department of Computer Science";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        department: DEPARTMENT,
        ...(role === "student" && matricNumber.trim()
          ? { matricNumber: matricNumber.trim() }
          : {}),
      });
      router.push(`/${role}/dashboard`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message ?? "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

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
          flexDirection: "column",
        }}
        className="hidden md:flex"
      >
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
            Join UNIBEN · SmartAlert
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
            Your schedule, always current.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "oklch(0.82 0.012 83 / 0.85)",
              lineHeight: 1.6,
            }}
          >
            Create your account and enrol in courses to start receiving
            real-time lecture alerts.
          </p>
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
        }}
      >
        <div
          style={{
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
          Create your account
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "oklch(0.5 0.012 55)",
            marginBottom: 28,
          }}
        >
          Fill in the details below to get started.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Harriet Samuel"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="reg-email">University email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@uniben.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <Label>I am a</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["student", "lecturer"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    borderRadius: 3,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.12s, border-color 0.12s",
                    border:
                      role === r
                        ? "1px solid oklch(0.55 0.16 41)"
                        : "1px solid oklch(0.82 0.014 78)",
                    background:
                      role === r
                        ? "oklch(0.94 0.03 50)"
                        : "transparent",
                    color: "oklch(0.24 0.014 55)",
                    textTransform: "capitalize",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="dept">Department</Label>
            <div
              style={{
                width: "100%",
                padding: "11px 13px",
                border: "1px solid oklch(0.84 0.014 78)",
                borderRadius: 3,
                fontSize: 14,
                color: "oklch(0.24 0.014 55)",
                background: "oklch(0.955 0.012 83)",
              }}
            >
              Computer Science
            </div>
          </div>

          {role === "student" && (
            <div>
              <Label htmlFor="matric">Matric number</Label>
              <Input
                id="matric"
                type="text"
                placeholder="e.g. CSC/2021/001"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13, color: "oklch(0.55 0.2 27)" }}>
              {error}
            </p>
          )}

          <Button variant="primary" size="full" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "oklch(0.5 0.012 55)",
            marginTop: 24,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "oklch(0.52 0.16 41)", textDecoration: "none" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
