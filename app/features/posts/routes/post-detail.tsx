import * as React from "react";
import { Link, redirect, useActionData, useNavigation, useSubmit } from "react-router";
import type { Route } from "./+types/post-detail";
import { getPost, updatePost, deletePost, type Post } from "../api";
import { updatePostSchema, type UpdatePostInput } from "../schemas";
import { PostForm } from "../components/PostForm";
import { PageHeader } from "~/components/PageHeader";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { Button } from "~/components/ui/button";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";
import { Can } from "~/features/access";
import { formatDate } from "~/lib/utils";
import { isApiError } from "~/lib/errors";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: `${loaderData?.post.title ?? "Post"} — find-cat-ely` }];
}

export const handle = {
  breadcrumb: (data: { post: Post }) => data?.post?.title ?? "Post",
};

export async function clientLoader({ params }: Route.ClientLoaderArgs): Promise<{ post: Post }> {
  const post = await getPost(params["id"]!);
  return { post };
}

type ActionData =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof UpdatePostInput, string>> };

export async function clientAction({ request, params }: Route.ClientActionArgs): Promise<ActionData | Response> {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    try {
      await deletePost(params["id"]!);
      return redirect("/posts");
    } catch (err) {
      if (isApiError(err)) return { ok: false, error: err.message };
      return { ok: false, error: "Failed to delete post." };
    }
  }

  const raw = {
    title: form.get("title") ?? undefined,
    content: form.get("content") ?? undefined,
  };
  const parsed = updatePostSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof UpdatePostInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof UpdatePostInput;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "Please fix the form errors.", fieldErrors };
  }

  try {
    await updatePost(params["id"]!, parsed.data);
    return redirect(`/posts/${params["id"]}`);
  } catch (err) {
    if (isApiError(err)) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to update post." };
  }
}

export default function PostDetailPage({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const isDeleting =
    navigation.state === "submitting" && navigation.formData?.get("intent") === "delete";
  const isUpdating =
    navigation.state === "submitting" && navigation.formData?.get("intent") !== "delete";

  const handleUpdate = (data: UpdatePostInput) => {
    submit(data as Record<string, string>, { method: "post" });
    setIsEditing(false);
  };

  const handleDelete = () => {
    submit({ intent: "delete" }, { method: "post" });
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-page">
      <PageHeader
        title={isEditing ? "Edit post" : post.title}
        description={isEditing ? undefined : `Last updated on ${formatDate(post.updatedAt)}`}
      >
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Can action="update" subject="Post" attributes={{ authorId: post.authorId }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit post
              </Button>
            </Can>
            <Can action="delete" subject="Post" attributes={{ authorId: post.authorId }}>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete post
              </Button>
            </Can>
          </div>
        )}
      </PageHeader>

      {actionData && !actionData.ok && (
        <div role="alert" className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 p-3">
          {actionData.error}
        </div>
      )}

      {isEditing ? (
        <PostForm
          defaultValues={{ title: post.title, content: post.content }}
          submitLabel="Save changes"
          submitting={isUpdating}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {post.content}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Author ID: <code className="font-mono">{post.authorId}</code></span>
            <span>Created: {formatDate(post.createdAt)}</span>
          </div>

          <div>
            <Link
              to="/posts"
              className="text-xs text-primary hover:underline font-medium"
            >
              ← Back to posts
            </Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete post"
        description="Are you sure you want to delete this post? This action will permanently remove it."
        confirmLabel="Delete post"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };

