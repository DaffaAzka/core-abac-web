import * as React from "react";
import { useCan } from "../hooks";

interface CanProps {
  action: string;
  subject: string;
  attributes?: Record<string, unknown>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Convenience component to hide or show UI based on ABAC decision.
 * Treats the client check as a convenience only — the backend still enforces 403.
 */
export function Can({ action, subject, attributes, fallback = null, children }: CanProps) {
  const allowed = useCan(action, subject, attributes);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

