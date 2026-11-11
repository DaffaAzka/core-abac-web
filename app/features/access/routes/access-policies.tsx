import * as React from "react";
import { useActionData, useLoaderData, useSubmit } from "react-router";
import type { Route } from "./+types/access-policies";
import { listPolicies, definePolicy, deletePolicy, type Policy } from "../api";
import { definePolicySchema, type DefinePolicyInput } from "../schemas";
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
  return [{ title: "ABAC Policies" }];
}

export const handle = { breadcrumb: "Policies" };

export async function clientLoader(): Promise<{ policies: Policy[] }> {
  const policies = await listPolicies();
  return { policies };
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
      const priority = parseInt(form.get("priority") as string, 10) || 0;
      const enabled = form.get("enabled") === "true";
      const targetRaw = form.get("target") as string;
      const rulesRaw = form.get("rules") as string;

      let target: Record<string, unknown> | undefined;
      if (targetRaw && targetRaw.trim()) {
        try {
          target = JSON.parse(targetRaw);
        } catch {
          return { ok: false, error: "Target must be valid JSON object." };
        }
      }

      let rules: DefinePolicyInput["rules"];
      try {
        rules = JSON.parse(rulesRaw);
      } catch {
        return { ok: false, error: "Rules must be a valid JSON array." };
      }

      const parsed = definePolicySchema.safeParse({
        name,
        priority,
        enabled,
        target,
        rules,
      });
      if (!parsed.success) {
        return {
          ok: false,
          error:
            parsed.error.issues[0]?.message ?? "Invalid policy definition.",
        };
      }

      await definePolicy(parsed.data);
      invalidatePermissionCache();
      return { ok: true };
    }

    if (intent === "delete") {
      const id = form.get("id") as string;
      await deletePolicy(id);
      invalidatePermissionCache();
      return { ok: true };
    }

    return { ok: false, error: "Unrecognized action." };
  } catch (err) {
    if (isApiError(err)) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to process policy request." };
  }
}

export default function AccessPoliciesPage({
  loaderData,
}: Route.ComponentProps) {
  const { policies } = loaderData;
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const [showDefineModal, setShowDefineModal] = React.useState(false);
  const [policyToDelete, setPolicyToDelete] = React.useState<string | null>(
    null,
  );

  const handleDeleteConfirm = () => {
    if (!policyToDelete) return;
    submit({ intent: "delete", id: policyToDelete }, { method: "post" });
    setPolicyToDelete(null);
  };

  const columns: Column<Policy>[] = [
    {
      key: "name",
      header: "Policy Name",
      cell: (policy) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-foreground">{policy.name}</p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {policy.id}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (policy) => (
        <Badge variant={policy.enabled ? "success" : "secondary"}>
          {policy.enabled ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (policy) => (
        <span className="text-xs font-mono text-muted-foreground">
          {policy.priority}
        </span>
      ),
    },
    {
      key: "target",
      header: "Target Matcher",
      cell: (policy) => {
        if (!policy.target || Object.keys(policy.target).length === 0) {
          return (
            <span className="text-xs text-muted-foreground">
              Universal (all requests)
            </span>
          );
        }
        return (
          <code className="text-[11px] font-mono bg-muted/50 px-1 py-0.5 rounded text-foreground">
            {JSON.stringify(policy.target)}
          </code>
        );
      },
    },
    {
      key: "rules",
      header: "Rules",
      cell: (policy) => (
        <span className="text-xs text-muted-foreground">
          {policy.rules.length} rule{policy.rules.length !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cell: (policy) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={() => setPolicyToDelete(policy.id)}>
            Delete policy
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
          {policies.length} dynamic ABAC polic
          {policies.length !== 1 ? "ies" : "y"} evaluated by CASL
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowDefineModal(true)}>
          Define policy
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
        <DefinePolicyForm onClose={() => setShowDefineModal(false)} />
      )}

      <DataTable
        data={policies}
        columns={columns}
        getRowKey={(p) => p.id}
        emptyTitle="No policies defined"
        emptyDescription="Define an ABAC policy to conditionally apply authorization rules."
      />

      <ConfirmDialog
        open={!!policyToDelete}
        title="Delete policy"
        description="Are you sure you want to delete this policy? CASL will stop evaluating these rules."
        confirmLabel="Delete policy"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPolicyToDelete(null)}
      />
    </div>
  );
}

function DefinePolicyForm({ onClose }: { onClose: () => void }) {
  const submit = useSubmit();
  const [name, setName] = React.useState("");
  const [priority, setPriority] = React.useState("0");
  const [enabled, setEnabled] = React.useState(true);
  const [target, setTarget] = React.useState("");
  const [rules, setRules] = React.useState(
    JSON.stringify([{ action: "read", subject: "Post" }], null, 2),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      {
        intent: "define",
        name,
        priority,
        enabled: String(enabled),
        target,
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
          Define ABAC policy
        </h2>
        <p className="text-xs text-muted-foreground">
          Policies evaluate context variables such as user attributes or
          environment variables.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="policy-name">Policy Name</Label>
          <Input
            id="policy-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. restrict-sensitive-posts"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="policy-priority">Priority (lower = first)</Label>
          <Input
            id="policy-priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="policy-target">
          Target Context Matcher (Optional JSON)
        </Label>
        <Input
          id="policy-target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder='{"env.isBusinessHours": true}'
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="policy-rules">Rules (CASL JSON)</Label>
        <Textarea
          id="policy-rules"
          rows={4}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="font-mono text-xs"
          placeholder='[{"action": "read", "subject": "Post"}]'
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="policy-enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-input text-primary focus:ring-primary h-4 w-4"
        />
        <Label htmlFor="policy-enabled">Policy active and enabled</Label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Save policy
        </Button>
      </div>
    </form>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
