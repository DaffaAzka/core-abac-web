import { type RouteConfig, index, layout } from "@react-router/dev/routes";
import { authRoutes } from "./features/auth/routes";
import { postsRoutes } from "./features/posts/routes";
import { usersRoutes } from "./features/users/routes";
import { accessRoutes } from "./features/access/routes";

export default [
  // Public auth feature routes
  ...authRoutes,

  // Protected application shell with unified auth layout loader
  layout("routes/app-layout.tsx", [
    index("routes/home.tsx"),
    ...postsRoutes,
    ...usersRoutes,
    ...accessRoutes,
  ]),
] satisfies RouteConfig;
