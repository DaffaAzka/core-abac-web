import { layout, route, type RouteConfigEntry } from "@react-router/dev/routes";

export const authRoutes: RouteConfigEntry[] = [
  layout("features/auth/routes/auth-layout.tsx", [
    route("sign-in", "features/auth/routes/sign-in.tsx"),
    route("sign-up", "features/auth/routes/sign-up.tsx"),
  ]),
  route("sign-out", "features/auth/routes/sign-out.tsx"),
];

