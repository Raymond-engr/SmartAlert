"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import type { AppUser, Course } from "@/types";

interface DeptOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: DeptOption[];
  course?: Course | null;
  onSaved: () => void | Promise<void>;
}

const errStyle = { fontSize: 13, color: "oklch(0.55 0.2 27)" } as const;

export function CourseFormDialog({
  open,
  onOpenChange,
  departments,
  course,
  onSaved,
}: Props) {
  const isEdit = Boolean(course);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [units, setUnits] = useState(1);
  const [lecturer, setLecturer] = useState("");
  const [lecturers, setLecturers] = useState<AppUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the lecturer options whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    api
      .get<{ success: boolean; data: AppUser[] }>("/admin/users", {
        params: { role: "lecturer" },
      })
      .then((res) => setLecturers(res.data.data))
      .catch(() => setLecturers([]));
  }, [open]);

  // Prefill (or reset) the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setCode(course?.code ?? "");
    setName(course?.title ?? "");
    setDepartment(course?.department ?? "");
    setUnits(course?.units ?? 1);
    setLecturer("");
  }, [open, course]);

  // The course list only exposes the lecturer's name, so resolve it to an id
  // once the lecturer options have loaded.
  useEffect(() => {
    if (!open || !course || lecturers.length === 0) return;
    const match = lecturers.find((l) => l.name === course.lecturer);
    if (match) setLecturer(match.id);
  }, [open, course, lecturers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { code, name, department, units, lecturer };
      if (isEdit && course) {
        await api.put(`/courses/${course.id}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "Add course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the course details below."
              : "Create a new course for the department."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <Label htmlFor="course-code">Course code</Label>
            <Input
              id="course-code"
              type="text"
              placeholder="e.g. CSC 401"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="course-name">Title</Label>
            <Input
              id="course-name"
              type="text"
              placeholder="e.g. Software Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="course-dept">Department</Label>
            <Select
              id="course-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="" disabled>
                Select department
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Label htmlFor="course-units">Units</Label>
              <Input
                id="course-units"
                type="number"
                min={1}
                max={6}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
              />
            </div>
            <div style={{ flex: 2 }}>
              <Label htmlFor="course-lecturer">Lecturer</Label>
              <Select
                id="course-lecturer"
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
              >
                <option value="" disabled>
                  Select lecturer
                </option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error && <p style={errStyle}>{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
