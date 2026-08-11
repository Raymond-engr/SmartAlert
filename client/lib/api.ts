import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let accessToken: string | null = null;

export function setAccessToken(t: string | null): void {
  accessToken = t;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ success: boolean; accessToken: string }>("/auth/refresh-token")
      .then((res) => {
        const token = res.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    // Auth endpoints returning 401 mean "these credentials are wrong" (login/
    // register) or "there is nothing to refresh" (refresh-token itself) — not
    // "the access token expired". Retrying those through refreshAccessToken()
    // would silently swap the real error for the refresh endpoint's own
    // 401 ("Refresh token is required"), which is what a wrong-password
    // attempt was showing instead of "Invalid credentials".
    const isAuthEndpoint = [
      "/auth/refresh-token",
      "/auth/login",
      "/auth/register",
    ].some((path) => config?.url?.includes(path));

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      const token = await refreshAccessToken();
      config.headers.set("Authorization", `Bearer ${token}`);
      return api(config);
    } catch (refreshError) {
      setAccessToken(null);
      return Promise.reject(refreshError);
    }
  },
);
