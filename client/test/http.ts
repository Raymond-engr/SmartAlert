import { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { vi } from "vitest";

export interface StubReply {
  status: number;
  data?: unknown;
}

export type Route = (config: InternalAxiosRequestConfig) => StubReply;

/**
 * Replaces the transport under an axios instance while leaving every
 * interceptor in place, so a test exercises the real request/response
 * pipeline (auth header, refresh-and-retry) rather than a stand-in for it.
 */
export function installAdapter(api: AxiosInstance, route: Route) {
  const calls: InternalAxiosRequestConfig[] = [];

  api.defaults.adapter = async (config) => {
    calls.push(config);
    const reply = route(config);
    const response = {
      data: reply.data ?? {},
      status: reply.status,
      statusText: "",
      headers: {},
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(
        `stub ${reply.status}`,
        String(reply.status),
        config,
        {},
        response
      );
    }
    return response;
  };

  return {
    calls,
    urls: () => calls.map((c) => c.url ?? ""),
    countOf: (url: string) => calls.filter((c) => c.url === url).length,
    authOf: (i: number) => calls[i]?.headers?.Authorization as string | undefined,
  };
}

/** A socket double: records handlers so tests can fire server events. */
export function socketDouble() {
  const handlers = new Map<string, Set<(...a: unknown[]) => void>>();
  const socket = {
    on: vi.fn((ev: string, fn: (...a: unknown[]) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    }),
    off: vi.fn((ev: string, fn: (...a: unknown[]) => void) => {
      handlers.get(ev)?.delete(fn);
    }),
    disconnect: vi.fn(),
  };
  return {
    socket,
    emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    listenerCount: (ev: string) => handlers.get(ev)?.size ?? 0,
  };
}
