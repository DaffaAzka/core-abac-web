import * as React from "react";
import { useActionData, useLoaderData, useSubmit } from "react-router";
import type { Route } from "./+types/access-grants";
import {
  listGrants,
  grantPermission,
  denyPermission,
  revokeGrant,
  type Grant,
} from "../api";
import { grantInputSchema } from "../schemas";
import { invalidatePermissionCache } from "../can";
import { listUsers, type UserListItem } from "@/features/users";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { formatDateOnly } from "@/lib/utils";
import { isApiError } from "@/lib/errors";

export function meta(): Route.MetaDescriptors {
  return [{ title: "User Grants" }];
}

export const handle = { breadcrumb: "User Grants" };

type UserGrantData = {
  user: UserListItem;
  grants: Grant[];
};

export async function clientLoader(): Promise<{ userGrants: UserGrantData[] }> {
  const users = await listUsers();
  const userGrants = await Promise.all(
    users.map(async (user) => {
      const grants = await listGrants(user.id);
      return { user, grants };
    }),
  );
  return { userGrants };
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
    if (intent === "grant" || intent === "deny") {
      const userId = form.get("userId") as string;
      const action = form.get("action") as string;
      const subject = form.get("subject") as string;
      const resourceId = (form.get("resourceId") as string) || undefined;
      const reason = (form.get("reason") as string) || undefined;

      const parsed = grantInputSchema.safeParse({
        action,
        subject,
        resourceId,
        reason,
      });

      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid grant details.",
        };
      }

      if (intent === "grant") {
        await grantPermission(userId, parsed.data);
      } else {
        await denyPermission(userId, parsed.data);
      }

      invalidatePermissionCache();
      return { ok: true };
    }

    if (intent === "revoke") {
      const grantId = form.get("grantId") as string;
      await revokeGrant(grantId);
      invalidatePermissionCache();
      return { ok: true };
    }

    return { ok: false, error: "Unrecognized action." };
  } catch (err) {
    if (isApiError(err)) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to update user grant." };
  }
}

export default function AccessGrantsPage({ loaderData }: Route.ComponentProps) {
  const { userGrants } = loaderData;
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const [grantingUser, setGrantingUser] = React.useState<UserListItem | null>(
    null,
  );
  const [grantToRevoke, setGrantToRevoke] = React.useState<string | null>(null);

  const handleRevokeConfirm = () => {
    if (!grantToRevoke) return;
    submit({ intent: "revoke", grantId: grantToRevoke }, { method: "post" });
    setGrantToRevoke(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Direct user grants and explicit denials take precedence over RBAC and
          ABAC rules.
        </p>
      </div>

      {actionData && !actionData.ok && (
        <div
          role="alert"
          className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
          {actionData.error}
        </div>
      )}

      {userGrants.length === 0 ?
        <EmptyState
          title="No users found"
          description="Users must be registered before granting individual permissions."
        />
      : <div className="space-y-4">
          {userGrants.map(({ user, grants }) => (
            <div
              key={user.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setGrantingUser(user)}>
                  Add grant / denial
                </Button>
              </div>

              {grants.length === 0 ?
                <p className="text-xs text-muted-foreground italic">
                  No individual grants or denials
                </p>
              : <div className="divide-y divide-border/60">
                  {grants.map((grant) => {
                    const rule = grant.rule;
                    const actions =
                      Array.isArray(rule.action) ?
                        rule.action.join(", ")
                      : rule.action;
                    const subjects =
                      Array.isArray(rule.subject) ?
                        rule.subject.join(", ")
                      : rule.subject;

                    return (
                      <div
                        key={grant.id}
                        className="py-2.5 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                rule.inverted ? "destructive" : "success"
                              }>
                              {rule.inverted ? "Deny" : "Grant"}
                            </Badge>
                            <span className="font-mono text-xs text-foreground font-medium">
                              {actions} on {subjects}
                            </span>
                            {grant.expiresAt && (
                              <span className="text-[11px] text-muted-foreground">
                                (expires {formatDateOnly(grant.expiresAt)})
                              </span>
                            )}
                          </div>
                          {rule.reason && (
                            <p className="text-xs text-muted-foreground">
                              {rule.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="xs"
                          onClick={() => setGrantToRevoke(grant.id)}>
                          Revoke
                        </Button>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          ))}
        </div>
      }

      {grantingUser && (
        <AddGrantModal
          user={grantingUser}
          onClose={() => setGrantingUser(null)}
        />
      )}

      <ConfirmDialog
        open={!!grantToRevoke}
        title="Revoke access grant"
        description="Are you sure you want to revoke this direct permission? Normal RBAC/ABAC rules will apply."
        confirmLabel="Revoke grant"
        destructive
        onConfirm={handleRevokeConfirm}
        onCancel={() => setGrantToRevoke(null)}
      />
    </div>
  );
}

function AddGrantModal({
  user,
  onClose,
}: {
  user: UserListItem;
  onClose: () => void;
}) {
  const submit = useSubmit();
  const [action, setAction] = React.useState("read");
  const [subject, setSubject] = React.useState("Post");
  const [resourceId, setResourceId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isDeny, setIsDeny] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      {
        intent: isDeny ? "deny" : "grant",
        userId: user.id,
        action,
        subject,
        resourceId,
        reason,
      },
      { method: "post" },
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg space-y-4 animate-in zoom-in-95">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {isDeny ? "Add ACL Denial Override" : "Add Direct ACL Grant"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Assign permission or override for user{" "}
            <span className="font-semibold text-foreground">{user.name}</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="grant-action">Action</Label>
            <Input
              id="grant-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. read, update, delete"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grant-subject">Subject</Label>
            <Input
              id="grant-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Post, User, all"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grant-resource-id">
            Specific Resource ID (Optional)
          </Label>
          <Input
            id="grant-resource-id"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            placeholder="e.g. 1, 2, or UUID"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grant-reason">
            Reason (Surfaced in 403 messages)
          </Label>
          <Input
            id="grant-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Temporary project auditor grant"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="grant-is-deny"
            type="checkbox"
            checked={isDeny}
            onChange={(e) => setIsDeny(e.target.checked)}
            className="rounded border-input text-destructive focus:ring-destructive h-4 w-4"
          />
          <Label
            htmlFor="grant-is-deny"
            className="text-destructive font-medium">
            Explicit denial (cannot override)
          </Label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant={isDeny ? "destructive" : "default"}>
            {isDeny ? "Apply denial" : "Apply grant"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
