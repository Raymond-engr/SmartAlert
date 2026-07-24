import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { installAdapter } from "@/test/http";
import type { AppUser } from "@/types";

const closeSocket = vi.fn();
vi.mock("@/lib/socket", () => ({
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), disconnect: vi.fn() })),
  closeSocket: () => closeSocket(),
}));

const STUDENT: AppUser = {
  id: "u1",
  name: "Harriet Samuel",
  firstName: "Harriet",
  initials: "HS",
  email: "harriet@uniben.edu.ng",
  role: "student",
  department: "Department of Computer Science",
  departmentCode: "CSC",
  matricNumber: "CSC/2021/001",
  isActive: true,
  notificationPreferences: { inApp: true, email: true },
};

async function loadAuth() {
  vi.resetModules();
  const api = await import("@/lib/api");
  const auth = await import("@/context/AuthContext");
  return { ...api, ...auth };
}

beforeEach(() => {
  closeSocket.mockClear();
});

/** Renders the provider and hands the context back to the test. */
function mount(
  AuthProvider: React.ComponentType<{ children: React.ReactNode }>,
  useAuth: () => unknown
) {
  const seen: { current: any } = { current: null };
  function Probe() {
    const ctx = useAuth() as any;
    seen.current = ctx;
    return (
      <div>
        <span data-testid="loading">{String(ctx.loading)}</span>
        <span data-testid="user">{ctx.user?.name ?? "anonymous"}</span>
      </div>
    );
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  return seen;
}

describe("bootstrap on first paint", () => {
  it("restores the session from the refresh cookie", async () => {
    const { api, AuthProvider, useAuth, getAccessToken } = await loadAuth();
    installAdapter(api, (config) =>
      config.url === "/auth/refresh-token"
        ? { status: 200, data: { success: true, accessToken: "boot-token" } }
        : { status: 200, data: { success: true, user: STUDENT } }
    );

    mount(AuthProvider, useAuth);

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("user")).toHaveTextContent("Harriet Samuel");
    expect(getAccessToken()).toBe("boot-token");
  });

  it("settles as signed-out when there is no valid cookie", async () => {
    const { api, AuthProvider, useAuth } = await loadAuth();
    installAdapter(api, () => ({ status: 401 }));

    mount(AuthProvider, useAuth);

    // the guard in every protected layout renders null until loading clears,
    // so a bootstrap that never resolves would be a permanently blank app
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  });

  it("settles even when /auth/me fails after a good refresh", async () => {
    const { api, AuthProvider, useAuth } = await loadAuth();
    installAdapter(api, (config) =>
      config.url === "/auth/refresh-token"
        ? { status: 200, data: { success: true, accessToken: "boot-token" } }
        : { status: 500 }
    );

    mount(AuthProvider, useAuth);

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  });
});

describe("login", () => {
  it("stores the token and user, and returns the user for routing", async () => {
    const { api, AuthProvider, useAuth, getAccessToken } = await loadAuth();
    installAdapter(api, (config) => {
      if (config.url === "/auth/refresh-token") return { status: 401 };
      return {
        status: 200,
        data: { success: true, accessToken: "login-token", user: STUDENT },
      };
    });

    const ctx = mount(AuthProvider, useAuth);
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );

    let returned: AppUser | undefined;
    await act(async () => {
      returned = await ctx.current.login("harriet@uniben.edu.ng", "pw");
    });

    // the login page routes to `/${user.role}/dashboard` off this value
    expect(returned?.role).toBe("student");
    expect(getAccessToken()).toBe("login-token");
    expect(screen.getByTestId("user")).toHaveTextContent("Harriet Samuel");
  });

  it("propagates bad credentials without signing anyone in", async () => {
    const { api, AuthProvider, useAuth } = await loadAuth();
    installAdapter(api, () => ({
      status: 401,
      data: { success: false, message: "Invalid credentials" },
    }));

    const ctx = mount(AuthProvider, useAuth);
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );

    await expect(
      ctx.current.login("harriet@uniben.edu.ng", "wrong")
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  });
});

describe("logout", () => {
  it("clears the session and tears down the socket", async () => {
    const { api, AuthProvider, useAuth, getAccessToken } = await loadAuth();
    installAdapter(api, (config) =>
      config.url === "/auth/refresh-token"
        ? { status: 200, data: { success: true, accessToken: "boot-token" } }
        : { status: 200, data: { success: true, user: STUDENT } }
    );

    const ctx = mount(AuthProvider, useAuth);
    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("Harriet Samuel")
    );

    await act(async () => {
      await ctx.current.logout();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(getAccessToken()).toBeNull();
    expect(closeSocket).toHaveBeenCalled();
  });

  it("still clears local state when the server call fails", async () => {
    const { api, AuthProvider, useAuth, getAccessToken } = await loadAuth();
    installAdapter(api, (config) => {
      if (config.url === "/auth/refresh-token")
        return { status: 200, data: { success: true, accessToken: "boot" } };
      if (config.url === "/auth/logout") return { status: 500 };
      return { status: 200, data: { success: true, user: STUDENT } };
    });

    const ctx = mount(AuthProvider, useAuth);
    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("Harriet Samuel")
    );

    // a user who taps sign-out on a flaky connection must still end up signed
    // out locally, otherwise the app looks logged in with a dead session
    await act(async () => {
      await expect(ctx.current.logout()).rejects.toThrow();
    });

    expect(getAccessToken()).toBeNull();
    expect(closeSocket).toHaveBeenCalled();
  });
});

describe("useAuth", () => {
  it("refuses to be used outside a provider", async () => {
    const { useAuth } = await loadAuth();
    function Orphan() {
      useAuth();
      return null;
    }
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/must be used within an AuthProvider/);
    quiet.mockRestore();
  });
});
