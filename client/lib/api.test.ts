import { describe, it, expect, vi } from "vitest";
import { installAdapter } from "@/test/http";

/**
 * `lib/api` keeps module-level state — the access token and the in-flight
 * refresh promise — so every case takes a fresh copy. Without the reset a
 * token set in one test would authenticate the next one.
 */
async function freshApi() {
  vi.resetModules();
  return import("@/lib/api");
}

describe("request interceptor", () => {
  it("attaches the bearer token once one is set", async () => {
    const { api, setAccessToken } = await freshApi();
    const http = installAdapter(api, () => ({ status: 200 }));

    setAccessToken("token-abc");
    await api.get("/sessions");

    expect(http.authOf(0)).toBe("Bearer token-abc");
  });

  it("sends no authorization header while signed out", async () => {
    const { api } = await freshApi();
    const http = installAdapter(api, () => ({ status: 200 }));

    await api.get("/courses");

    expect(http.authOf(0)).toBeUndefined();
  });
});

describe("401 refresh and retry", () => {
  it("refreshes, then replays the original request with the new token", async () => {
    const { api, setAccessToken, getAccessToken } = await freshApi();
    setAccessToken("stale");

    let sessionsSeen = 0;
    const http = installAdapter(api, (config) => {
      if (config.url === "/auth/refresh-token") {
        return { status: 200, data: { success: true, accessToken: "fresh" } };
      }
      sessionsSeen += 1;
      // expired on the first attempt, accepted on the replay
      return sessionsSeen === 1
        ? { status: 401 }
        : { status: 200, data: { success: true, data: [] } };
    });

    const res = await api.get("/sessions");

    expect(res.status).toBe(200);
    expect(http.urls()).toEqual(["/sessions", "/auth/refresh-token", "/sessions"]);
    // the replay must carry the new token, not the stale one
    expect(http.authOf(2)).toBe("Bearer fresh");
    expect(getAccessToken()).toBe("fresh");
  });

  it("refreshes only once when several requests expire together", async () => {
    const { api, setAccessToken } = await freshApi();
    setAccessToken("stale");

    const expired = new Set(["/sessions", "/courses", "/notifications/me"]);
    const http = installAdapter(api, (config) => {
      if (config.url === "/auth/refresh-token") {
        return { status: 200, data: { success: true, accessToken: "fresh" } };
      }
      if (expired.has(config.url ?? "")) {
        expired.delete(config.url ?? "");
        return { status: 401 };
      }
      return { status: 200, data: { success: true, data: [] } };
    });

    await Promise.all([
      api.get("/sessions"),
      api.get("/courses"),
      api.get("/notifications/me"),
    ]);

    // three simultaneous 401s, one refresh — this is the whole point of the
    // shared in-flight promise
    expect(http.countOf("/auth/refresh-token")).toBe(1);
  });

  it("retries a given request at most once", async () => {
    const { api, setAccessToken } = await freshApi();
    setAccessToken("stale");

    const http = installAdapter(api, (config) =>
      config.url === "/auth/refresh-token"
        ? { status: 200, data: { success: true, accessToken: "fresh" } }
        : { status: 401 }
    );

    // the server rejects even the refreshed token; this must terminate
    await expect(api.get("/sessions")).rejects.toThrow();
    expect(http.countOf("/sessions")).toBe(2);
    expect(http.countOf("/auth/refresh-token")).toBe(1);
  });

  it("does not try to refresh a failing refresh call", async () => {
    const { api } = await freshApi();
    const http = installAdapter(api, () => ({ status: 401 }));

    await expect(api.post("/auth/refresh-token")).rejects.toThrow();

    // one attempt only: recursing here would loop forever
    expect(http.countOf("/auth/refresh-token")).toBe(1);
  });

  it("drops the access token when the refresh is rejected", async () => {
    const { api, setAccessToken, getAccessToken } = await freshApi();
    setAccessToken("stale");

    installAdapter(api, () => ({ status: 401 }));

    await expect(api.get("/sessions")).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
  });

  it("can refresh again after an earlier refresh failed", async () => {
    const { api, setAccessToken } = await freshApi();
    setAccessToken("stale");

    let refreshWorks = false;
    let attemptsAfterRecovery = 0;
    const http = installAdapter(api, (config) => {
      if (config.url === "/auth/refresh-token") {
        return refreshWorks
          ? { status: 200, data: { success: true, accessToken: "fresh" } }
          : { status: 401 };
      }
      if (!refreshWorks) return { status: 401 };
      // expired once more, then accepted on the replay
      attemptsAfterRecovery += 1;
      return attemptsAfterRecovery === 1 ? { status: 401 } : { status: 200 };
    });

    await expect(api.get("/sessions")).rejects.toThrow();

    // the in-flight promise must have been cleared, or every later request
    // would re-await the original rejection and never recover
    refreshWorks = true;
    setAccessToken("stale-again");
    await expect(api.get("/sessions")).resolves.toBeDefined();
    expect(http.countOf("/auth/refresh-token")).toBe(2);
  });

  it("leaves non-401 failures alone", async () => {
    const { api, setAccessToken, getAccessToken } = await freshApi();
    setAccessToken("good");

    const http = installAdapter(api, () => ({ status: 500 }));

    await expect(api.get("/sessions")).rejects.toThrow();
    expect(http.countOf("/auth/refresh-token")).toBe(0);
    // a server error is not an auth problem: the session must survive it
    expect(getAccessToken()).toBe("good");
  });
});

describe("configuration", () => {
  it("sends credentials so the refresh cookie rides along", async () => {
    const { api } = await freshApi();
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("targets the versioned api prefix", async () => {
    const { api } = await freshApi();
    expect(api.defaults.baseURL).toBe("http://localhost:5000/api/v1");
  });
});
