"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Course } from "@/types";

export function useCourses(search?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Course[] }>(
        "/courses",
        { params: search ? { search } : undefined }
      );
      setCourses(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { courses, loading, refetch };
}
