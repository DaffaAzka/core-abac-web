import * as React from "react";
import {
  useActionData,
  useFetcher,
  useLoaderData,
  useSubmit,
} from "react-router";
import type { Route } from "./+types/access-roles";
import { listRoles, defineRole, deleteRole, type Role } from "../api";
import { defineRoleSchema, type DefineRoleInput } from "../schemas";
import { invalidatePermissionCache } from "../can";
import { DataTable, type Column } from "~/components/DataTable";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";
import { isApiError } from "~/lib/errors";

export function meta(): Route.MetaDescriptors {
  return [{ title: "RBAC Roles" }];
}

export const handle = { breadcrumb: "Roles" };

export async function clientLoader(): Promise<{ roles: Role[] }> {
  const roles = await listRoles();
  return { roles };
}

type ActionData =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ActionData> {
  const form = await request.formData();
  const intent = form.get("intent") as string;

  try {
    if (intent === "define") {
      const name = form.get("name") as string;
      const description = (form.get("description") as string) || undefined;
      const parentsRaw = form.get("parents") as string;
      const rulesRaw = form.get("rules") as string;

      const parents =
        parentsRaw ?
          parentsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      let rules: DefineRoleInput["rules"] = [];
      if (rulesRaw && rulesRaw.trim()) {
        try {
          rules = JSON.parse(rulesRaw);
        } catch {
          return { ok: false, error: "Rules must be valid JSON array." };
        }
      }

      const parsed = defineRoleSchema.safeParse({
        name,
        description,
        parents,
        rules,
      });
      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid role definition.",
        };
      }

      await defineRole(parsed.data);
      invalidatePermissionCache();
      return { ok: true };
    }

    if (intent === "delete") {
      const name = form.get("name") as string;
      await deleteRole(name);
      invalidatePermissionCache();
      return { ok: true };
    }

    return { ok: false, error: "Unrecognized action." };
  } catch (err) {
    if (isApiError(err)) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to process role request." };
  }
}

export default function AccessRolesPage({ loaderData }: Route.ComponentProps) {
  const { roles } = loaderData;
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const [showDefineModal, setShowDefineModal] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (!roleToDelete) return;
    submit({ intent: "delete", name: roleToDelete }, { method: "post" });
    setRoleToDelete(null);
  };

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Role Name",
      cell: (role) => (
        <div className="space-y-0.5">
          <p className="font-semibold font-mono text-xs text-foreground">
            {role.name}
          </p>
          {role.description && (
            <p className="text-xs text-muted-foreground">{role.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "parents",
      header: "Inherits From",
      cell: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.parents.length === 0 ?
            <span className="text-xs text-muted-foreground">—</span>
          : role.parents.map((p) => (
              <Badge key={p} variant="secondary">
                {p}
              </Badge>
            ))
          }
        </div>
      ),
    },
    {
      key: "rules",
      header: "Rules",
      cell: (role) => (
        <span className="text-xs text-muted-foreground">
          {role.rules.length} rule{role.rules.length !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (role) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={() => setRoleToDelete(role.name)}>
            Delete role
          </Button>
        </div>
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""} registered in the
          RBAC hierarchy
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowDefineModal(true)}>
          Define role
        </Button>
      </div>

      {actionData && !actionData.ok && (
        <div
          role="alert"
          className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
          {actionData.error}
        </div>
      )}

      {showDefineModal && (
        <DefineRoleForm
          onClose={() => setShowDefineModal(false)}
          existingRoles={roles.map((r) => r.name)}
        />
      )}

      <DataTable
        data={roles}
        columns={columns}
        getRowKey={(r) => r.name}
        emptyTitle="No roles defined"
        emptyDescription="Define a role to assign permissions to users."
      />

      <ConfirmDialog
        open={!!roleToDelete}
        title={`Delete role "${roleToDelete}"`}
        description="Users assigned this role will lose permissions inherited from it. This cannot be undone."
        confirmLabel="Delete role"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRoleToDelete(null)}
      />
    </div>
  );
}

function DefineRoleForm({
  onClose,
  existingRoles,
}: {
  onClose: () => void;
  existingRoles: string[];
}) {
  const submit = useSubmit();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parents, setParents] = React.useState("");
  const [rules, setRules] = React.useState(
    JSON.stringify([{ action: "read", subject: "Post" }], null, 2),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      {
        intent: "define",
        name,
        description,
        parents,
        rules,
      },
      { method: "post" },
    );
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">
          Define or update role
        </h2>
        <p className="text-xs text-muted-foreground">
          Specify role identifier, parent roles for inheritance, and optional
          CASL rules.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="role-name">Role Name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. moderator"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-parents">Parents (comma-separated)</Label>
          <Input
            id="role-parents"
            value={parents}
            onChange={(e) => setParents(e.target.value)}
            placeholder={existingRoles.slice(0, 2).join(", ") || "viewer"}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role-description">Description</Label>
        <Input
          id="role-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief explanation of this role's purpose"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role-rules">Rules (CASL JSON)</Label>
        <Textarea
          id="role-rules"
          rows={4}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="font-mono text-xs"
          placeholder='[{"action": "read", "subject": "Post"}]'
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Save role
        </Button>
      </div>
    </form>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
