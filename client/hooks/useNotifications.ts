"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Alert } from "@/types";

/**
 * Every mounted copy of this hook, so one of them marking an alert read can
 * tell the others to catch up.
 *
 * The sidebar badge lives in the student layout and the list lives in the
 * page, which are two separate instances with two separate states. Without
 * this, opening the alerts screen would clear the alerts but leave the badge
 * showing a count that is no longer true until a full reload.
 */
const subscribers = new Set<() => void>();

const notifyAll = () => {
  subscribers.forEach((refetch) => {
    void refetch();
  });
};

export function useNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, countRes] = await Promise.all([
        api.get<{ success: boolean; data: Alert[] }>("/notifications/me"),
        api.get<{ success: boolean; data: { count: number } }>(
          "/notifications/me/unread-count"
        ),
      ]);
      setAlerts(alertsRes.data.data);
      setUnreadCount(countRes.data.data.count);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    subscribers.add(refetch);
    return () => {
      subscribers.delete(refetch);
    };
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

  const markRead = useCallback(async (id: string) => {
    await api.patch<{ success: boolean; data: Alert }>(
      `/notifications/${id}/read`
    );
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unread: false } : a))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    notifyAll();
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch<{ success: boolean; data: { updated: number } }>(
      "/notifications/read-all"
    );
    setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })));
    setUnreadCount(0);
    notifyAll();
  }, []);

  return { alerts, unreadCount, loading, markRead, markAllRead, refetch };
}
