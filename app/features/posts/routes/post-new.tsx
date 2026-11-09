import * as React from "react";
import { redirect, useActionData, useNavigation, useSubmit } from "react-router";
import type { Route } from "./+types/post-new";
import { createPost } from "../api";
import { createPostSchema, type CreatePostInput } from "../schemas";
import { PostForm } from "../components/PostForm";
import { PageHeader } from "~/components/PageHeader";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";
import { can } from "~/features/access";
import { isApiError } from "~/lib/errors";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Write post — find-cat-ely" }];
}

export const handle = { breadcrumb: "Write post" };

export async function clientLoader(): Promise<null> {
  const allowed = await can("create", "Post");
  if (!allowed) {
    throw new Response("You don't have permission to create posts.", { status: 403 });
  }
  return null;
}

type ActionData =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof CreatePostInput, string>> };

export async function clientAction({ request }: Route.ClientActionArgs): Promise<ActionData | Response> {
  const form = await request.formData();
  const raw = {
    title: form.get("title"),
    content: form.get("content"),
  };
  const parsed = createPostSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CreatePostInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof CreatePostInput;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "Please fix the validation errors below.", fieldErrors };
  }

  try {
    const post = await createPost(parsed.data);
    return redirect(`/posts/${post.id}`);
  } catch (err) {
    if (isApiError(err)) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Failed to create post." };
  }
}

export default function PostNewPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const handleSubmit = (data: CreatePostInput) => {
    submit(data as Record<string, string>, { method: "post" });
  };

  return (
    <div className="space-y-6 max-w-2xl animate-page">
      <PageHeader
        title="Write post"
        description="Create a new post protected by attribute-based access control."
      />

      <PostForm
        submitLabel="Publish post"
        submitting={isSubmitting}
        generalError={actionData && !actionData.ok ? actionData.error : undefined}
        fieldErrors={actionData && !actionData.ok ? actionData.fieldErrors : undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };

