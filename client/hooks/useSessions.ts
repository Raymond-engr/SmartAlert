"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Session } from "@/types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Session[] }>(
        "/sessions"
      );
      setSessions(res.data.data);
      setError(null);
    } catch {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const socket = getSocket(token);
    socket.on("session:update", refetch);

    return () => {
      socket.off("session:update", refetch);
    };
  }, [refetch]);

  return { sessions, loading, error, refetch };
}
