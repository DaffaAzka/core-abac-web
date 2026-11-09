import * as React from "react";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/posts";
import { listPosts, type PostListItem } from "../api";
import { PageHeader } from "~/components/PageHeader";
import { EmptyState } from "~/components/EmptyState";
import { RouteErrorBoundary } from "~/components/RouteErrorBoundary";
import { Can } from "~/features/access";
import { formatDateOnly } from "~/lib/utils";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Posts — find-cat-ely" }];
}

export const handle = { breadcrumb: "Posts" };

export async function clientLoader(): Promise<{ posts: PostListItem[] }> {
  const posts = await listPosts();
  return { posts };
}

export default function PostsPage({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posts"
        description="Public posts and entries accessible to your account."
      >
        <Can action="create" subject="Post">
          <Link
            to="/posts/new"
            className="inline-flex h-8 items-center px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Write post
          </Link>
        </Can>
      </PageHeader>

      {posts.length === 0 ? (
        <EmptyState
          title="No posts published yet"
          description="Posts published through the API or web client will appear here."
          action={
            <Can action="create" subject="Post">
              <Link
                to="/posts/new"
                className="inline-flex h-8 items-center px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Write the first post
              </Link>
            </Can>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <article key={post.id} className="py-4 space-y-1">
              <div className="flex items-baseline justify-between gap-4">
                <Link
                  to={`/posts/${post.id}`}
                  className="text-base font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {post.title}
                </Link>
                <time className="text-xs text-muted-foreground shrink-0" dateTime={post.createdAt}>
                  {formatDateOnly(post.createdAt)}
                </time>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {post.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };

