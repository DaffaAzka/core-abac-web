import * as React from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/users";
import { listUsers, assignRole, revokeRole, type UserListItem } from "../api";
import { listRoles, type Role, can, Can } from "@/features/access";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { isApiError } from "@/lib/errors";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Users" }];
}

export const handle = { breadcrumb: "Users" };

export async function clientLoader(): Promise<{
  users: UserListItem[];
  roles: Role[];
}> {
  const allowed = await can("read", "User");
  if (!allowed) {
    throw new Response("You do not have permission to view users.", {
      status: 403,
    });
  }

  const [users, roles] = await Promise.all([
    listUsers(),
    can("manage", "all").then((canManage) =>
      canManage ? listRoles() : Promise.resolve([]),
    ),
  ]);
  return { users, roles };
}

type ActionData = { ok: boolean; error?: string };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ActionData> {
  const form = await request.formData();
  const intent = form.get("intent") as string;
  const userId = form.get("userId") as string;

  try {
    if (intent === "assign-role") {
      const role = form.get("role") as string;
      await assignRole(userId, { role });
      return { ok: true };
    }
    if (intent === "revoke-role") {
      const role = form.get("role") as string;
      await revokeRole(userId, role);
      return { ok: true };
    }
    return { ok: false, error: "Unrecognized action." };
  } catch (err) {
    if (isApiError(err)) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to update user role." };
  }
}

function RoleActionsCell({
  user,
  roles,
}: {
  user: UserListItem;
  roles: Role[];
}) {
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";

  const availableRoles = roles.filter((r) => !user.roles.includes(r.name));

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    fetcher.submit(
      { intent: "assign-role", userId: user.id, role: selectedRole },
      { method: "post" },
    );
    setIsAssigning(false);
    setSelectedRole("");
  };

  const handleRevoke = (role: string) => {
    fetcher.submit(
      { intent: "revoke-role", userId: user.id, role },
      { method: "post" },
    );
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Can action="manage" subject="all">
        {isAssigning ?
          <form onSubmit={handleAssign} className="flex items-center gap-1.5">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              required>
              <option value="">Select role…</option>
              {availableRoles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              size="xs"
              disabled={isSubmitting || !selectedRole}>
              Assign
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsAssigning(false)}>
              Cancel
            </Button>
          </form>
        : availableRoles.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                setSelectedRole(availableRoles[0]?.name ?? "");
                setIsAssigning(true);
              }}>
              Assign role
            </Button>
          )
        }
      </Can>
    </div>
  );
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { users, roles } = loaderData;

  const columns: Column<UserListItem>[] = [
    {
      key: "user",
      header: "User",
      cell: (user) => (
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Assigned Roles",
      cell: (user) => (
        <div className="flex flex-wrap gap-1 items-center">
          {user.roles.length === 0 ?
            <span className="text-xs text-muted-foreground">
              No roles assigned
            </span>
          : user.roles.map((role) => (
              <span key={role} className="inline-flex items-center gap-1">
                <Badge variant="default">
                  <span className="ml-2">{role}</span>
                  <Can action="manage" subject="all">
                    <RoleRevokeButton userId={user.id} role={role} />
                  </Can>
                </Badge>
              </span>
            ))
          }
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (user) => <RoleActionsCell user={user} roles={roles} />,
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Users"
        description="Profiles and assigned RBAC roles for users registered in the system."
      />

      <DataTable
        data={users}
        columns={columns}
        getRowKey={(u) => u.id}
        emptyTitle="No users found"
        emptyDescription="Registered user accounts will appear in this list."
      />
    </div>
  );
}

function RoleRevokeButton({ userId, role }: { userId: string; role: string }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  return (
    <button
      type="button"
      onClick={() => {
        fetcher.submit(
          { intent: "revoke-role", userId, role },
          { method: "post" },
        );
      }}
      disabled={isSubmitting}
      aria-label={`Revoke role ${role}`}
      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">
      <span
        aria-hidden="true"
        className="text-xs text-white rounded-full w-4 h-4 flex items-center justify-center hover:text-gray-400">
        ×
      </span>
    </button>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
