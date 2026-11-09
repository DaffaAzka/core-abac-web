import { route, type RouteConfigEntry } from "@react-router/dev/routes";

export const usersRoutes: RouteConfigEntry[] = [
  route("users", "features/users/routes/users.tsx"),
];

