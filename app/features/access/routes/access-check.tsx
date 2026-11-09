import * as React from "react";
import { useActionData, useNavigation, useSubmit } from "react-router";
import type { Route } from "./+types/access-check";
import { checkPermission, type CheckPermissionResult } from "../api";
import { checkPermissionSchema } from "../schemas";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";
import { isApiError } from "~/lib/errors";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Test Permission — find-cat-ely" }];
}

export const handle = { breadcrumb: "Test Permission" };

export async function clientLoader(): Promise<null> {
  return null;
}

type ActionData =
  | { ok: true; result: CheckPermissionResult }
  | { ok: false; error: string };

export async function clientAction({ request }: Route.ClientActionArgs): Promise<ActionData> {
  const form = await request.formData();
  const action = form.get("action") as string;
  const subject = form.get("subject") as string;
  const field = (form.get("field") as string) || undefined;
  const attributesRaw = form.get("attributes") as string;

  let attributes: Record<string, unknown> | undefined;
  if (attributesRaw && attributesRaw.trim()) {
    try {
      attributes = JSON.parse(attributesRaw);
    } catch {
      return { ok: false, error: "Attributes must be valid JSON." };
    }
  }

  const parsed = checkPermissionSchema.safeParse({ action, subject, field, attributes });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid check request." };
  }

  try {
    const result = await checkPermission(parsed.data);
    return { ok: true, result };
  } catch (err) {
    if (isApiError(err)) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to evaluate permission." };
  }
}

export default function AccessCheckPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isChecking = navigation.state === "submitting";

  const [action, setAction] = React.useState("create");
  const [subject, setSubject] = React.useState("Post");
  const [field, setField] = React.useState("");
  const [attributes, setAttributes] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      {
        action,
        subject,
        field,
        attributes,
      },
      { method: "post" }
    );
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">ABAC Decision Tester</h2>
        <p className="text-xs text-muted-foreground">
          Query the backend authorization engine (`POST /access/check`) to test whether the current principal is permitted to perform an action.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="check-action">Action</Label>
            <Input
              id="check-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. read, update, delete"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-subject">Subject</Label>
            <Input
              id="check-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Post, User, all"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="check-field">Specific Field (Optional)</Label>
          <Input
            id="check-field"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. title, content"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="check-attributes">Subject Attributes (Optional JSON)</Label>
          <Textarea
            id="check-attributes"
            rows={3}
            value={attributes}
            onChange={(e) => setAttributes(e.target.value)}
            placeholder='{"authorId": "user_id_here"}'
            className="font-mono text-xs"
          />
        </div>

        <Button type="submit" disabled={isChecking} className="w-full">
          {isChecking ? "Evaluating CASL ability…" : "Evaluate permission"}
        </Button>
      </form>

      {actionData && (
        <div className="animate-in fade-in">
          {actionData.ok ? (
            <div
              className={`rounded-lg border p-4 space-y-2 ${
                actionData.result.allowed
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-destructive/30 bg-destructive/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Evaluation Result
                </span>
                <Badge variant={actionData.result.allowed ? "success" : "destructive"}>
                  {actionData.result.allowed ? "ALLOWED" : "DENIED"}
                </Badge>
              </div>
              <div className="text-xs space-y-1 font-mono">
                <p>Action: <span className="text-foreground">{actionData.result.action}</span></p>
                <p>Subject: <span className="text-foreground">{actionData.result.subject}</span></p>
                <p>Principal ID: <span className="text-foreground">{actionData.result.userId}</span></p>
              </div>
            </div>
          ) : (
            <div role="alert" className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
              {actionData.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };

