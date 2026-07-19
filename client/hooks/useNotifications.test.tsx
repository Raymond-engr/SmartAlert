import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { installAdapter, socketDouble } from "@/test/http";
import type { Alert } from "@/types";

const wire = socketDouble();
vi.mock("@/lib/socket", () => ({
  getSocket: () => wire.socket,
  closeSocket: vi.fn(),
}));

const ALERTS: Alert[] = [
  {
    id: "a1",
    courseCode: "CSC 311",
    courseName: "Software Engineering",
    status: "cancelled",
    message: "Today's lecture is cancelled.",
    createdAt: "2026-07-19T08:00:00.000Z",
    unread: true,
  },
  {
    id: "a2",
    courseCode: "CSC 321",
    courseName: "Operating Systems",
    status: "rescheduled",
    message: "Moved to LT2 at 14:00.",
    createdAt: "2026-07-18T08:00:00.000Z",
    unread: true,
  },
];

async function loadHook() {
  vi.resetModules();
  const api = await import("@/lib/api");
  const hook = await import("@/hooks/useNotifications");
  api.setAccessToken("token"); // the socket effect bails out without one
  return { ...api, ...hook };
}

/**
 * A small stateful fake of the notifications API. The hook refetches itself
 * after every mutation, so a stub that kept replying "still unread" would
 * make a correct optimistic update look broken.
 */
function fakeServer(initial: Alert[]) {
  let alerts = initial.map((a) => ({ ...a }));
  return {
    route: (config: { url?: string; method?: string }) => {
      const url = config.url ?? "";
      if (url === "/notifications/me")
        return { status: 200, data: { success: true, data: alerts } };
      if (url === "/notifications/me/unread-count")
        return {
          status: 200,
          data: {
            success: true,
            data: { count: alerts.filter((a) => a.unread).length },
          },
        };
      if (url === "/notifications/read-all") {
        alerts = alerts.map((a) => ({ ...a, unread: false }));
        return { status: 200, data: { success: true, data: { updated: 2 } } };
      }
      const read = url.match(/^\/notifications\/(.+)\/read$/);
      if (read) {
        alerts = alerts.map((a) =>
          a.id === read[1] ? { ...a, unread: false } : a
        );
        return { status: 200, data: { success: true, data: {} } };
      }
      return { status: 200, data: { success: true, data: {} } };
    },
    push: (a: Alert) => {
      alerts = [a, ...alerts];
    },
    set: (next: Alert[]) => {
      alerts = next.map((x) => ({ ...x }));
    },
  };
}

function Probe({ use, id }: { use: () => any; id: string }) {
  const { alerts, unreadCount, loading } = use();
  return (
    <div>
      <span data-testid={`${id}-count`}>{unreadCount}</span>
      <span data-testid={`${id}-alerts`}>{alerts.length}</span>
      <span data-testid={`${id}-loading`}>{String(loading)}</span>
    </div>
  );
}

describe("loading alerts", () => {
  it("fetches the list and the badge count together", async () => {
    const { api, useNotifications } = await loadHook();
    installAdapter(api, fakeServer(ALERTS).route);

    render(<Probe use={useNotifications} id="x" />);

    await waitFor(() =>
      expect(screen.getByTestId("x-loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("x-alerts")).toHaveTextContent("2");
    expect(screen.getByTestId("x-count")).toHaveTextContent("2");
  });
});

describe("marking read", () => {
  it("clears one alert and decrements the badge", async () => {
    const { api, useNotifications } = await loadHook();
    installAdapter(api, fakeServer(ALERTS).route);

    let ctx: any;
    function Host() {
      ctx = useNotifications();
      return <span data-testid="count">{ctx.unreadCount}</span>;
    }
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));

    await act(async () => {
      await ctx.markRead("a1");
    });

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(ctx.alerts.find((a: Alert) => a.id === "a1").unread).toBe(false);
    expect(ctx.alerts.find((a: Alert) => a.id === "a2").unread).toBe(true);
  });

  it("never drives the badge below zero", async () => {
    const { api, useNotifications } = await loadHook();
    installAdapter(api, fakeServer([{ ...ALERTS[0], unread: false }]).route);

    let ctx: any;
    function Host() {
      ctx = useNotifications();
      return <span data-testid="count">{ctx.unreadCount}</span>;
    }
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));

    // double-tapping an already-read alert must not produce "-1 alerts"
    await act(async () => {
      await ctx.markRead("a1");
    });
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("clears everything on mark-all-read", async () => {
    const { api, useNotifications } = await loadHook();
    installAdapter(api, fakeServer(ALERTS).route);

    let ctx: any;
    function Host() {
      ctx = useNotifications();
      return <span data-testid="count">{ctx.unreadCount}</span>;
    }
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));

    await act(async () => {
      await ctx.markAllRead();
    });

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(ctx.alerts.every((a: Alert) => !a.unread)).toBe(true);
  });
});

describe("keeping instances in step", () => {
  it("updates the sidebar badge when the alerts page marks all read", async () => {
    const { api, useNotifications } = await loadHook();
    installAdapter(api, fakeServer(ALERTS).route);

    let pageCtx: any;
    function Sidebar() {
      const { unreadCount } = useNotifications();
      return <span data-testid="badge">{unreadCount}</span>;
    }
    function Page() {
      pageCtx = useNotifications();
      return <span data-testid="page">{pageCtx.unreadCount}</span>;
    }
    render(
      <>
        <Sidebar />
        <Page />
      </>
    );

    await waitFor(() => expect(screen.getByTestId("badge")).toHaveTextContent("2"));

    await act(async () => {
      await pageCtx.markAllRead();
    });

    // the badge lives in the layout and the list in the page: two separate
    // hook instances, so this only passes because of the subscriber fan-out
    await waitFor(() => expect(screen.getByTestId("badge")).toHaveTextContent("0"));
  });
});

describe("live updates", () => {
  it("refetches when the server pushes a session change", async () => {
    const { api, useNotifications } = await loadHook();
    const server = fakeServer([]);
    const http = installAdapter(api, server.route);

    render(<Probe use={useNotifications} id="y" />);
    await waitFor(() =>
      expect(screen.getByTestId("y-loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("y-alerts")).toHaveTextContent("0");

    // a lecturer cancels a class while the student is looking at the screen
    server.set(ALERTS);
    await act(async () => {
      wire.emit("session:update");
    });

    await waitFor(() =>
      expect(screen.getByTestId("y-alerts")).toHaveTextContent("2")
    );
    expect(http.countOf("/notifications/me")).toBe(2);
  });

  it("detaches its listener on unmount", async () => {
    const { api, useNotifications } = await loadHook();
    installAdapter(api, fakeServer(ALERTS).route);

    const { unmount } = render(<Probe use={useNotifications} id="z" />);
    await waitFor(() => expect(wire.listenerCount("session:update")).toBe(1));

    unmount();

    // a leak here would refetch on behalf of screens that are long gone
    expect(wire.listenerCount("session:update")).toBe(0);
  });
});
