import React from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { isApiError } from "~/lib/errors";

/**
 * Shared route error boundary that treats 401/403/404/network errors differently.
 * Use as the ErrorBoundary export in route modules.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const { status, title, message, showSignIn } = classify(error);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-7xl font-display font-bold text-primary/20 select-none">{status}</span>
      <h1 className="mt-3 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{message}</p>
      <div className="mt-6 flex gap-3">
        {showSignIn ? (
          <Link
            to="/sign-in"
            className="inline-flex h-9 items-center px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Sign in
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex h-9 items-center px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go home
          </Link>
        )}
      </div>
    </div>
  );
}

function classify(error: unknown): {
  status: string;
  title: string;
  message: string;
  showSignIn: boolean;
} {
  if (isRouteErrorResponse(error)) {
    if (error.status === 401) {
      return { status: "401", title: "Session expired", message: "Sign in to continue.", showSignIn: true };
    }
    if (error.status === 403) {
      return { status: "403", title: "Access denied", message: "You don't have permission to view this page.", showSignIn: false };
    }
    if (error.status === 404) {
      return { status: "404", title: "Page not found", message: "The page you're looking for doesn't exist.", showSignIn: false };
    }
    return { status: String(error.status), title: "Something went wrong", message: error.statusText || "An unexpected error occurred.", showSignIn: false };
  }

  if (isApiError(error)) {
    if (error.isUnauthorized) {
      return { status: "401", title: "Session expired", message: "Sign in to continue.", showSignIn: true };
    }
    if (error.isForbidden) {
      return { status: "403", title: "Access denied", message: error.message, showSignIn: false };
    }
    if (error.isNotFound) {
      return { status: "404", title: "Not found", message: error.message, showSignIn: false };
    }
    if (error.code === "NETWORK_ERROR") {
      return { status: "—", title: "Connection error", message: "Could not reach the server. Check your connection and try again.", showSignIn: false };
    }
    return { status: "Error", title: "Something went wrong", message: error.message, showSignIn: false };
  }

  if (error instanceof Error) {
    return { status: "Error", title: "Unexpected error", message: error.message, showSignIn: false };
  }

  return { status: "Error", title: "Something went wrong", message: "An unexpected error occurred.", showSignIn: false };
}

