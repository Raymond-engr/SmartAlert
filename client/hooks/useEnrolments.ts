"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Enrolment } from "@/types";

export function useEnrolments() {
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Enrolment[] }>(
        "/enrolments/me"
      );
      setEnrolments(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const enrol = useCallback(async (courseId: string) => {
    await api.post<{ success: boolean; data: Enrolment }>("/enrolments", {
      courseId,
    });
    await refetch();
  }, [refetch]);

  const unenrol = useCallback(
    async (courseId: string) => {
      const enrolment = enrolments.find((e) => e.course.id === courseId);
      if (!enrolment) {
        return;
      }
      await api.delete<{ success: boolean; message: string }>(
        `/enrolments/${enrolment.id}`
      );
      await refetch();
    },
    [enrolments, refetch]
  );

  return { enrolments, loading, enrol, unenrol, refetch };
}
