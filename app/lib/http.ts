import axios, { type AxiosError } from "axios";
import { env } from "./env";
import { ApiError, normalizeError } from "./errors";

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Attach Bearer token from localStorage on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Normalize every error response into ApiError
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // 401: token expired. Better Auth does not have a refresh-token flow in its
    // bearer plugin, so we clear the session and let the auth layout redirect.
    if (status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        localStorage.removeItem("auth_token");
        refreshQueue.forEach((cb) => cb(false));
        refreshQueue = [];
        isRefreshing = false;
      } else {
        await new Promise<void>((res) => {
          refreshQueue.push(() => res());
        });
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

