"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/useCourses";
import { useEnrolments } from "@/hooks/useEnrolments";

export default function EnrollPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const { courses } = useCourses(search);
  const { enrolments, enrol, unenrol } = useEnrolments();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const enrolled = useMemo(
    () => new Set(enrolments.map((e) => e.course.id)),
    [enrolments]
  );

  const filtered = useMemo(() => {
    let list = courses;
    if (tab === "mine") list = list.filter((c) => enrolled.has(c.id));
    if (search.trim())
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.lecturer.toLowerCase().includes(search.toLowerCase())
      );
    return list;
  }, [courses, search, tab, enrolled]);

  async function toggleEnroll(id: string) {
    setPending((prev) => new Set(prev).add(id));
    try {
      if (enrolled.has(id)) await unenrol(id);
      else await enrol(id);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 760 }}>
      <h1
        style={{
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "oklch(0.24 0.014 55)",
          marginBottom: 4,
        }}
      >
        Enrol in courses
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "oklch(0.5 0.012 55)",
          marginBottom: 22,
        }}
      >
        Add courses to your personal timetable and receive alerts for any
        schedule changes.
      </p>

      {/* Search + tabs */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 200,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "oklch(0.99 0.007 83)",
            border: "1px solid oklch(0.84 0.014 78)",
            borderRadius: 3,
            padding: "11px 14px",
          }}
        >
          <Search
            size={15}
            style={{ color: "oklch(0.6 0.01 55)", flexShrink: 0 }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "oklch(0.24 0.014 55)",
              background: "transparent",
              width: "100%",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            border: "1px solid oklch(0.84 0.014 78)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                border: "none",
                background: tab === t ? "oklch(0.24 0.014 55)" : "transparent",
                color:
                  tab === t
                    ? "oklch(0.99 0.007 83)"
                    : "oklch(0.5 0.012 55)",
                transition: "background 0.12s",
              }}
            >
              {t === "all" ? "All courses" : "My courses"}
            </button>
          ))}
        </div>
      </div>

      {/* Course list */}
      <div
        style={{
          background: "oklch(0.99 0.007 83)",
          border: "1px solid oklch(0.86 0.014 78)",
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 18px",
              textAlign: "center",
              fontSize: 14,
              color: "oklch(0.6 0.01 55)",
            }}
          >
            No courses found
          </div>
        ) : (
          filtered.map((course, i) => (
            <div
              key={course.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "15px 18px",
                borderBottom:
                  i < filtered.length - 1
                    ? "1px solid oklch(0.9 0.012 80)"
                    : "none",
              }}
            >
              {/* Code */}
              <div style={{ minWidth: 66, flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "oklch(0.24 0.014 55)",
                  }}
                >
                  {course.code}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 10,
                    color: "oklch(0.6 0.01 55)",
                  }}
                >
                  {course.units} units
                </div>
              </div>

              {/* Name + lecturer */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "oklch(0.26 0.014 55)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {course.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "oklch(0.55 0.012 55)",
                    marginTop: 2,
                  }}
                >
                  {course.lecturer}
                </div>
              </div>

              {/* Action */}
              {enrolled.has(course.id) ? (
                <button
                  onClick={() => toggleEnroll(course.id)}
                  disabled={pending.has(course.id)}
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 12,
                    fontWeight: 500,
                    border: "1px solid oklch(0.86 0.014 78)",
                    borderRadius: 3,
                    padding: "7px 14px",
                    background: "transparent",
                    color: "oklch(0.55 0.13 152)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily2: "inherit",
                  } as React.CSSProperties}
                >
                  ✓ Enrolled
                </button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toggleEnroll(course.id)}
                  disabled={pending.has(course.id)}
                >
                  Enrol
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
