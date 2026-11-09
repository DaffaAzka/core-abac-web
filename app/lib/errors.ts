import type { AxiosError } from "axios";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.code === "UNAUTHORIZED";
  }
  get isForbidden() {
    return this.code === "FORBIDDEN";
  }
  get isNotFound() {
    return this.code === "NOT_FOUND";
  }
}

export function normalizeError(err: AxiosError): ApiError {
  if (!err.response) {
    return new ApiError("NETWORK_ERROR", "Could not reach the server. Check your connection.", undefined, err);
  }

  const { status, data } = err.response;
  const body = data as Record<string, unknown> | undefined;
  const message =
    (typeof body?.["message"] === "string" ? body["message"] : null) ??
    (typeof body?.["error"] === "string" ? body["error"] : null) ??
    err.message ??
    "An unexpected error occurred.";

  switch (status) {
    case 400:
    case 422:
      return new ApiError("VALIDATION", message, status, body);
    case 401:
      return new ApiError("UNAUTHORIZED", "Your session has expired. Sign in again.", status, body);
    case 403:
      return new ApiError("FORBIDDEN", message || "You don't have permission to do that.", status, body);
    case 404:
      return new ApiError("NOT_FOUND", message || "The requested resource was not found.", status, body);
    case 500:
    case 502:
    case 503:
      return new ApiError("SERVER_ERROR", "The server encountered an error. Try again shortly.", status, body);
    default:
      return new ApiError("UNKNOWN", message, status, body);
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

