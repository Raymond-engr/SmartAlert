"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusChip } from "@/components/StatusChip";
import { CourseFormDialog } from "@/components/admin/CourseFormDialog";
import { DepartmentFormDialog } from "@/components/admin/DepartmentFormDialog";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/lib/api";
import { useSessions } from "@/hooks/useSessions";
import { useCourses } from "@/hooks/useCourses";
import type { AppUser, Course, Department } from "@/types";

interface DepartmentRef {
  id: string;
  name: string;
  code: string;
  faculty: string;
}

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
  const { sessions } = useSessions();
  const { courses, refetch: refetchCourses } = useCourses();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [departmentRefs, setDepartmentRefs] = useState<DepartmentRef[]>([]);
  const [tab, setTab] = useState("users");

  // Dialog state
  const [courseDialog, setCourseDialog] = useState<{ open: boolean; course: Course | null }>({
    open: false,
    course: null,
  });
  const [departmentDialog, setDepartmentDialog] = useState<{ open: boolean; department: Department | null }>({
    open: false,
    department: null,
  });
  const [userDialog, setUserDialog] = useState<{ open: boolean; user: AppUser | null }>({
    open: false,
    user: null,
  });
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await api.get<{ success: boolean; data: AppUser[] }>("/admin/users");
    setUsers(res.data.data);
  }, []);

  const fetchDepartments = useCallback(async () => {
    const res = await api.get<{
      success: boolean;
      data: { faculties: unknown[]; departments: DepartmentRef[] };
    }>("/admin/departments");
    setDepartmentRefs(res.data.data.departments);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

  // /admin/departments only returns reference data (faculty + department
  // names/codes) — counts must be derived from the real users/courses lists.
  // Both join on the full department name, which is what a User or Course
  // actually stores; the code is display-only reference data.
  const departments: Department[] = useMemo(
    () =>
      departmentRefs.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        faculty: d.faculty,
        courses: courses.filter((c) => c.department === d.name).length,
        students: users.filter((u) => u.role === "student" && u.department === d.name).length,
      })),
    [departmentRefs, courses, users]
  );

  const deptOptions = useMemo(
    () => departments.map((d) => ({ id: d.id, name: d.name })),
    [departments]
  );

  async function toggleActive(u: AppUser) {
    await api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive });
    await fetchUsers();
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-7">
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
        {(tab === "courses" || tab === "departments") && (
          <Button
            variant="primary"
            size="default"
            onClick={() =>
              tab === "courses"
                ? setCourseDialog({ open: true, course: null })
                : setDepartmentDialog({ open: true, department: null })
            }
          >
            <Plus size={14} /> Add new
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
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
                {users.map((u) => (
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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", border: "1px solid oklch(0.87 0.014 78)", borderRadius: 2, color: u.isActive ? "oklch(0.55 0.13 152)" : "oklch(0.55 0.2 27)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: u.isActive ? "oklch(0.55 0.13 152)" : "oklch(0.55 0.2 27)", flexShrink: 0 }} />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => setUserDialog({ open: true, user: u })}
                          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.55 0.16 41)", cursor: "pointer", padding: 0 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.53 0.2 27)", cursor: "pointer", padding: 0 }}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
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
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td style={{ ...TD, fontWeight: 600 }}>{d.name}</td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: 600 }}>{d.code}</span></td>
                    <td style={TD}>{d.courses}</td>
                    <td style={TD}>{d.students.toLocaleString()}</td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => setDepartmentDialog({ open: true, department: d })}
                          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.55 0.16 41)", cursor: "pointer", padding: 0 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDepartmentToDelete(d)}
                          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.53 0.2 27)", cursor: "pointer", padding: 0 }}
                        >
                          Delete
                        </button>
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
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600 }}>{c.code}</span></td>
                    <td style={{ ...TD, fontWeight: 600 }}>{c.title}</td>
                    <td style={TD}><span style={{ color: "oklch(0.5 0.012 55)" }}>{c.lecturer}</span></td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>{c.units}</span></td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => setCourseDialog({ open: true, course: c })}
                          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.55 0.16 41)", cursor: "pointer", padding: 0 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setCourseToDelete(c)}
                          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, background: "none", border: "none", color: "oklch(0.53 0.2 27)", cursor: "pointer", padding: 0 }}
                        >
                          Delete
                        </button>
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
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, fontWeight: 600 }}>{s.courseCode}</span></td>
                    <td style={{ ...TD, fontWeight: 600 }}>{s.courseName}</td>
                    <td style={TD}>{s.day}</td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>{s.startTime}–{s.endTime}</span></td>
                    <td style={TD}><span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>{s.venue}</span></td>
                    <td style={TD}><StatusChip status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Course add/edit */}
      <CourseFormDialog
        open={courseDialog.open}
        onOpenChange={(open) => setCourseDialog((s) => ({ ...s, open }))}
        departments={deptOptions}
        course={courseDialog.course}
        onSaved={refetchCourses}
      />

      {/* Department add/edit */}
      <DepartmentFormDialog
        open={departmentDialog.open}
        onOpenChange={(open) => setDepartmentDialog((s) => ({ ...s, open }))}
        department={departmentDialog.department}
        onSaved={fetchDepartments}
      />

      {/* User edit */}
      <UserFormDialog
        open={userDialog.open}
        onOpenChange={(open) => setUserDialog((s) => ({ ...s, open }))}
        departments={deptOptions}
        user={userDialog.user}
        onSaved={fetchUsers}
      />

      {/* Course delete */}
      <ConfirmDialog
        open={courseToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCourseToDelete(null);
        }}
        title="Delete course"
        description={
          courseToDelete
            ? `Delete ${courseToDelete.code} — ${courseToDelete.title}? This cannot be undone.`
            : ""
        }
        onConfirm={async () => {
          if (!courseToDelete) return;
          await api.delete(`/courses/${courseToDelete.id}`);
          await refetchCourses();
        }}
      />

      {/* Department delete */}
      <ConfirmDialog
        open={departmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDepartmentToDelete(null);
        }}
        title="Delete department"
        description={
          departmentToDelete
            ? `Delete ${departmentToDelete.name} (${departmentToDelete.code})? This cannot be undone.`
            : ""
        }
        onConfirm={async () => {
          if (!departmentToDelete) return;
          await api.delete(`/admin/departments/${departmentToDelete.id}`);
          await fetchDepartments();
        }}
      />
    </div>
  );
}
