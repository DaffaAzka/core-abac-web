import * as React from "react";
import { NavLink, Outlet } from "react-router";
import type { Route } from "./+types/access-layout";
import { can } from "../can";
import { PageHeader } from "~/components/PageHeader";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Access Control" }];
}

export const handle = { breadcrumb: "Access Control" };

export async function clientLoader(): Promise<null> {
  const allowed = await can("manage", "all");
  if (!allowed) {
    throw new Response(
      "You don't have permission to manage access control rules.",
      { status: 403 },
    );
  }
  return null;
}

function AccessTab({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "text-xs font-medium pb-2 border-b-2 transition-colors",
          isActive ?
            "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
        ].join(" ")
      }>
      {children}
    </NavLink>
  );
}

export default function AccessLayout() {
  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Access Control"
        description="Unified RBAC, ABAC, and ACL policy management engine."
      />

      <nav
        className="flex items-center gap-6 border-b border-border"
        aria-label="Access Control Sections">
        <AccessTab to="/access/roles">RBAC Roles</AccessTab>
        <AccessTab to="/access/policies">ABAC Policies</AccessTab>
        <AccessTab to="/access/grants">ACL User Grants</AccessTab>
        <AccessTab to="/access/check">Test Permission</AccessTab>
      </nav>

      <Outlet />
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
