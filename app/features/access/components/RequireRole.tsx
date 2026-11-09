import React from "react";
import { useCurrentUser } from "~/features/auth";

interface RequireRoleProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has the given role.
 * Intended for UI gating only — the API enforces real access.
 */
export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const user = useCurrentUser();
  if (!user?.roles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}

