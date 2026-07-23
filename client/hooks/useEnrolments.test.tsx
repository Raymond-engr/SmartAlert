import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { installAdapter } from "@/test/http";
import type { Enrolment } from "@/types";

vi.mock("@/lib/socket", () => ({
  getSocket: () => ({ on: vi.fn(), off: vi.fn(), disconnect: vi.fn() }),
  closeSocket: vi.fn(),
}));

const ENROLMENTS: Enrolment[] = [
  {
    id: "e1",
    course: {
      id: "c1",
      code: "CSC 311",
      title: "Software Engineering",
      department: "Department of Computer Science",
      units: 3,
      lecturer: "Dr. Okonkwo",
      enrolled: true,
    },
  },
];

async function loadHook() {
  vi.resetModules();
  const api = await import("@/lib/api");
  const hook = await import("@/hooks/useEnrolments");
  return { ...api, ...hook };
}

describe("useEnrolments", () => {
  it("loads the student's enrolments", async () => {
    const { api, useEnrolments } = await loadHook();
    installAdapter(api, () => ({
      status: 200,
      data: { success: true, data: ENROLMENTS },
    }));

    let ctx: any;
    function Host() {
      ctx = useEnrolments();
      return <span data-testid="n">{ctx.enrolments.length}</span>;
    }
    render(<Host />);

    await waitFor(() => expect(screen.getByTestId("n")).toHaveTextContent("1"));
  });

  it("deletes by enrolment id, not course id", async () => {
    const { api, useEnrolments } = await loadHook();
    const http = installAdapter(api, () => ({
      status: 200,
      data: { success: true, data: ENROLMENTS },
    }));

    let ctx: any;
    function Host() {
      ctx = useEnrolments();
      return <span data-testid="n">{ctx.enrolments.length}</span>;
    }
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId("n")).toHaveTextContent("1"));

    // the UI knows the course it is unenrolling from; the API is keyed by the
    // enrolment. Sending "c1" here would 404 against a route expecting "e1".
    await act(async () => {
      await ctx.unenrol("c1");
    });

    expect(http.urls()).toContain("/enrolments/e1");
    expect(http.urls()).not.toContain("/enrolments/c1");
  });

  it("does nothing when unenrolling from a course not enrolled in", async () => {
    const { api, useEnrolments } = await loadHook();
    const http = installAdapter(api, () => ({
      status: 200,
      data: { success: true, data: ENROLMENTS },
    }));

    let ctx: any;
    function Host() {
      ctx = useEnrolments();
      return <span data-testid="n">{ctx.enrolments.length}</span>;
    }
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId("n")).toHaveTextContent("1"));

    const before = http.calls.length;
    await act(async () => {
      await ctx.unenrol("does-not-exist");
    });

    expect(http.calls.length).toBe(before);
  });

  it("refetches after enrolling so the new course appears", async () => {
    const { api, useEnrolments } = await loadHook();
    const http = installAdapter(api, () => ({
      status: 200,
      data: { success: true, data: ENROLMENTS },
    }));

    let ctx: any;
    function Host() {
      ctx = useEnrolments();
      return <span data-testid="n">{ctx.enrolments.length}</span>;
    }
    render(<Host />);
    await waitFor(() => expect(screen.getByTestId("n")).toHaveTextContent("1"));

    await act(async () => {
      await ctx.enrol("c2");
    });

    expect(http.countOf("/enrolments")).toBe(1); // the POST
    expect(http.countOf("/enrolments/me")).toBe(2); // initial + refetch
  });
});
