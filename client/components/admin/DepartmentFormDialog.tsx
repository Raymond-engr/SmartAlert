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
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import type { Department } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSaved: () => void | Promise<void>;
}

const errStyle = { fontSize: 13, color: "oklch(0.55 0.2 27)" } as const;

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSaved,
}: Props) {
  const isEdit = Boolean(department);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(department?.name ?? "");
    setCode(department?.code ?? "");
    setFaculty(department?.faculty ?? "");
  }, [open, department]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { name, code, faculty };
      if (isEdit && department) {
        await api.put(`/admin/departments/${department.id}`, payload);
      } else {
        await api.post("/admin/departments", payload);
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
          <DialogTitle>
            {isEdit ? "Edit department" : "Add department"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the department details below."
              : "Create a new department."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <Label htmlFor="dept-name">Name</Label>
            <Input
              id="dept-name"
              type="text"
              placeholder="e.g. Computer Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dept-code">Code</Label>
            <Input
              id="dept-code"
              type="text"
              placeholder="e.g. CSC"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dept-faculty">Faculty</Label>
            <Input
              id="dept-faculty"
              type="text"
              placeholder="e.g. Physical Sciences"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
            />
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
                  : "Add department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
