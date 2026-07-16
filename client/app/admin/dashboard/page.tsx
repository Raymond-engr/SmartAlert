"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusChip } from "@/components/StatusChip";
import { getStatusColor } from "@/lib/utils";
import type { AdminUser, Department, Course, ScheduleEntry } from "@/types";

const USERS: AdminUser[] = [
  { id: "1", name: "Harriet Samuel", initials: "HS", email: "harriet@student.uniben.edu.ng", role: "student", active: true },
  { id: "2", name: "Emmanuel Okoro", initials: "EO", email: "emmanuel@uniben.edu.ng", role: "lecturer", active: true },
  { id: "3", name: "Sarah Adeola", initials: "SA", email: "sarah@uniben.edu.ng", role: "admin", active: true },
  { id: "4", name: "Amaka Eze", initials: "AE", email: "amaka@student.uniben.edu.ng", role: "student", active: false },
  { id: "5", name: "John Bello", initials: "JB", email: "john@uniben.edu.ng", role: "lecturer", active: true },
];

const DEPARTMENTS: Department[] = [
  { id: "1", name: "Computer Science", code: "CSC", courses: 12, students: 450 },
  { id: "2", name: "Mathematics", code: "MTH", courses: 8, students: 380 },
  { id: "3", name: "Physics", code: "PHY", courses: 10, students: 290 },
  { id: "4", name: "Chemistry", code: "CHM", courses: 9, students: 310 },
];

const COURSES: Course[] = [
  { id: "1", code: "CSC 401", title: "Software Engineering", lecturer: "Dr. Emmanuel Okoro", units: 3 },
  { id: "2", code: "CSC 305", title: "Database Systems", lecturer: "Dr. John Bello", units: 3 },
  { id: "3", code: "MTH 301", title: "Calculus III", lecturer: "Dr. Joseph Ihejiahi", units: 4 },
  { id: "4", code: "CSC 403", title: "Operating Systems", lecturer: "Dr. Faith Adama", units: 3 },
  { id: "5", code: "CSC 407", title: "Computer Networks", lecturer: "Dr. Chima Eze", units: 3 },
  { id: "6", code: "CSC 409", title: "Machine Learning", lecturer: "Dr. Ngozi Nwachukwu", units: 3 },
];

const SCHEDULE: ScheduleEntry[] = [
  { id: "1", courseCode: "CSC 401", courseName: "Software Engineering", day: "Monday", time: "10:00–12:00", venue: "LT1", status: "live" },
  { id: "2", courseCode: "CSC 305", courseName: "Database Systems", day: "Monday", time: "08:00–10:00", venue: "LT3", status: "done" },
  { id: "3", courseCode: "MTH 301", courseName: "Calculus III", day: "Tuesday", time: "10:00–12:00", venue: "LH2", status: "moved" },
  { id: "4", courseCode: "CSC 403", courseName: "Operating Systems", day: "Monday", time: "14:00–16:00", venue: "LT2", status: "cancelled" },
  { id: "5", courseCode: "CSC 407", courseName: "Computer Networks", day: "Tuesday", time: "14:00–16:00", venue: "LT1", status: "scheduled" },
  { id: "6", courseCode: "CSC 409", courseName: "Machine Learning", day: "Wednesday", time: "08:00–10:00", venue: "LT1", status: "scheduled" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "oklch(0.55 0.16 41)",
  lecturer: "oklch(0.5 0.1 245)",
  student: "oklch(0.5 0.012 55)",
};

const TH: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono), monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "oklch(0.55 0.012 55)",
  padding: "11px 18px",
  textAlign: "left",
  borderBottom: "1px solid oklch(0.86 0.014 78)",
  background: "oklch(0.955 0.012 83)",
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = {
  padding: "13px 18px",
  fontSize: 13,
  color: "oklch(0.24 0.014 55)",
  borderBottom: "1px solid oklch(0.9 0.012 80)",
  verticalAlign: "middle",
};

const TABLE: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

export default function AdminDashboard() {
  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em", color: "oklch(0.24 0.014 55)", marginBottom: 4 }}>
            Admin panel
          </h1>
          <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "oklch(0.6 0.01 55)" }}>
            University of Benin · Computer Science
          </p>
        </div>
        <Button variant="primary" size="default">
          <Plus size={14} /> Add new
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="schedule">Master Schedule</TabsTrigger>
        </TabsList>

        {/* Users */}
        <TabsContent value="users">
          <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: "0 0 5px 5px", overflowX: "auto" }}>
            <table style={{ ...TABLE, minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={TH}>Name</th>
                  <th style={TH}>Email</th>
                  <th style={TH}>Role</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u.id}>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 3, background: "oklch(0.955 0.012 83)", border: "1px solid oklch(0.86 0.014 78)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                          {u.initials}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "oklch(0.5 0.012 55)", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {u.email}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid oklch(0.87 0.014 78)", borderRadius: 2, color: ROLE_COLORS[u.role] }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid oklch(0.87 0.014 78)", borderRadius: 2, color: u.active ? "oklch(0.55 0.13 152)" : "oklch(0.55 0.2 27)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: u.active ? "oklch(0.55 0.13 152)" : "oklch(0.55 0.2 27)", flexShrink: 0 }} />
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.55 0.16 41)", cursor: "pointer", padding: 0 }}>Edit</button>
                        <button style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.53 0.2 27)", cursor: "pointer", padding: 0 }}>
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments">
          <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: "0 0 5px 5px", overflowX: "auto" }}>
            <table style={{ ...TABLE, minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={TH}>Department</th>
                  <th style={TH}>Code</th>
                  <th style={TH}>Courses</th>
                  <th style={TH}>Students</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((d) => (
                  <tr key={d.id}>
                    <td style={{ ...TD, fontWeight: 600 }}>{d.name}</td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 600 }}>{d.code}</span></td>
                    <td style={TD}>{d.courses}</td>
                    <td style={TD}>{d.students.toLocaleString()}</td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.55 0.16 41)", cursor: "pointer", padding: 0 }}>Edit</button>
                        <button style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.53 0.2 27)", cursor: "pointer", padding: 0 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses">
          <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: "0 0 5px 5px", overflowX: "auto" }}>
            <table style={{ ...TABLE, minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={TH}>Code</th>
                  <th style={TH}>Title</th>
                  <th style={TH}>Lecturer</th>
                  <th style={TH}>Units</th>
                  <th style={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {COURSES.map((c) => (
                  <tr key={c.id}>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600 }}>{c.code}</span></td>
                    <td style={{ ...TD, fontWeight: 600 }}>{c.title}</td>
                    <td style={TD}><span style={{ color: "oklch(0.5 0.012 55)" }}>{c.lecturer}</span></td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>{c.units}</span></td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.55 0.16 41)", cursor: "pointer", padding: 0 }}>Edit</button>
                        <button style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.53 0.2 27)", cursor: "pointer", padding: 0 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Master Schedule */}
        <TabsContent value="schedule">
          <div style={{ background: "oklch(0.99 0.007 83)", border: "1px solid oklch(0.86 0.014 78)", borderRadius: "0 0 5px 5px", overflowX: "auto" }}>
            <table style={{ ...TABLE, minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={TH}>Code</th>
                  <th style={TH}>Course</th>
                  <th style={TH}>Day</th>
                  <th style={TH}>Time</th>
                  <th style={TH}>Venue</th>
                  <th style={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map((s) => (
                  <tr key={s.id}>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600 }}>{s.courseCode}</span></td>
                    <td style={{ ...TD, fontWeight: 600 }}>{s.courseName}</td>
                    <td style={TD}>{s.day}</td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>{s.time}</span></td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>{s.venue}</span></td>
                    <td style={TD}><StatusChip status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
