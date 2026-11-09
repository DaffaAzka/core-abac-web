import { route, type RouteConfigEntry } from "@react-router/dev/routes";

export const postsRoutes: RouteConfigEntry[] = [
  route("posts", "features/posts/routes/posts.tsx"),
  route("posts/new", "features/posts/routes/post-new.tsx"),
  route("posts/:id", "features/posts/routes/post-detail.tsx"),
];

