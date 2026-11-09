import { layout, route, index, prefix, type RouteConfigEntry } from "@react-router/dev/routes";

export const accessRoutes: RouteConfigEntry[] = [
  ...prefix("access", [
    layout("features/access/routes/access-layout.tsx", [
      index("features/access/routes/access-roles.tsx"),
      route("roles", "features/access/routes/access-roles.tsx", { id: "access-roles-subpage" }),
      route("policies", "features/access/routes/access-policies.tsx"),
      route("grants", "features/access/routes/access-grants.tsx"),
      route("check", "features/access/routes/access-check.tsx"),
    ]),
  ]),
];

