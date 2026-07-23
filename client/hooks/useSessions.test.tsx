import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { installAdapter, socketDouble } from "@/test/http";
import type { Session } from "@/types";

const wire = socketDouble();
vi.mock("@/lib/socket", () => ({
  getSocket: () => wire.socket,
  closeSocket: vi.fn(),
}));

const SESSIONS: Session[] = [
  {
    id: "s1",
    courseId: "c1",
    courseCode: "CSC 311",
    courseName: "Software Engineering",
    day: "Monday",
    startTime: "10:00",
    endTime: "12:00",
    venue: "LT1",
    status: "scheduled",
    lecturer: "Dr. Okonkwo",
    canAct: false,
  },
];

async function loadHook(withToken = true) {
  vi.resetModules();
  const api = await import("@/lib/api");
  const hook = await import("@/hooks/useSessions");
  if (withToken) api.setAccessToken("token");
  return { ...api, ...hook };
}

function Host({ use }: { use: () => any }) {
  const { sessions, loading, error } = use();
  return (
    <div>
      <span data-testid="n">{sessions.length}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? "none"}</span>
    </div>
  );
}

describe("useSessions", () => {
  it("loads the timetable", async () => {
    const { api, useSessions } = await loadHook();
    installAdapter(api, () => ({
      status: 200,
      data: { success: true, data: SESSIONS },
    }));

    render(<Host use={useSessions} />);

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("n")).toHaveTextContent("1");
    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });

  it("surfaces an error instead of hanging on failure", async () => {
    const { api, useSessions } = await loadHook();
    installAdapter(api, () => ({ status: 500 }));

    render(<Host use={useSessions} />);

    await waitFor(() =>
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to load sessions"
      )
    );
    // a spinner that never stops is worse than an error message
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("clears a stale error once a retry succeeds", async () => {
    const { api, useSessions } = await loadHook();
    let broken = true;
    installAdapter(api, () =>
      broken
        ? { status: 500 }
        : { status: 200, data: { success: true, data: SESSIONS } }
    );

    let ctx: any;
    function Probe() {
      ctx = useSessions();
      return <Host use={() => ctx} />;
    }
    render(<Probe />);
    await waitFor(() =>
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to load sessions"
      )
    );

    broken = false;
    await act(async () => {
      await ctx.refetch();
    });

    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });

  it("refetches when a lecturer changes a class", async () => {
    const { api, useSessions } = await loadHook();
    let served: Session[] = [];
    const http = installAdapter(api, () => ({
      status: 200,
      data: { success: true, data: served },
    }));

    render(<Host use={useSessions} />);
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );

    served = SESSIONS;
    await act(async () => {
      wire.emit("session:update");
    });

    await waitFor(() => expect(screen.getByTestId("n")).toHaveTextContent("1"));
    expect(http.countOf("/sessions")).toBe(2);
  });

  it("skips the socket entirely when signed out", async () => {
    const { api, useSessions } = await loadHook(false);
    installAdapter(api, () => ({ status: 200, data: { success: true, data: [] } }));

    render(<Host use={useSessions} />);
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );

    expect(wire.listenerCount("session:update")).toBe(0);
  });
});
