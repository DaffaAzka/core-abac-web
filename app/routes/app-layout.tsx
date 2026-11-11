import * as React from "react";
import {
  Link,
  NavLink,
  Outlet,
  redirect,
  useMatches,
  useSubmit,
} from "react-router";
import type { Route } from "./+types/app-layout";
import {
  getSession,
  getStoredToken,
  sessionStore,
  clearToken,
  useCurrentUser,
} from "@/features/auth";
import { getMe } from "@/features/users";
import { Can } from "@/features/access";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import type { BreadcrumbHandle } from "@/root";

export async function clientLoader(): Promise<null> {
  const token = getStoredToken();
  if (!token) {
    throw redirect("/sign-in");
  }

  try {
    const [session, me] = await Promise.all([getSession(), getMe()]);
    sessionStore.setAuthenticated(
      {
        id: me.id,
        email: me.email,
        name: me.name,
        emailVerified: me.emailVerified,
        image: me.image,
        createdAt: me.createdAt,
        roles: me.roles,
      },
      token,
    );
    return null;
  } catch {
    clearToken();
    sessionStore.setUnauthenticated();
    throw redirect("/sign-in");
  }
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center h-8 px-3 rounded-md text-xs font-medium transition-colors",
          isActive ?
            "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        ].join(" ")
      }>
      {children}
    </NavLink>
  );
}

function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => (m.handle as BreadcrumbHandle | undefined)?.breadcrumb)
    .map((m) => {
      const handle = m.handle as BreadcrumbHandle;
      const label =
        typeof handle.breadcrumb === "function" ?
          handle.breadcrumb(m.loaderData)
        : handle.breadcrumb;
      return { label, to: m.pathname };
    });

  if (crumbs.length < 2) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.to}>
          {i > 0 && (
            <span aria-hidden className="text-border">
              /
            </span>
          )}
          {i < crumbs.length - 1 ?
            <Link to={c.to} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          : <span className="text-foreground font-medium">{c.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const user = useCurrentUser();
  const submit = useSubmit();

  const handleSignOut = () => {
    submit(null, { method: "post", action: "/sign-out" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              to="/posts"
              className="text-sm font-display font-semibold tracking-tight text-foreground">
              find-cat-ely
            </Link>
            <nav
              className="hidden sm:flex items-center gap-1"
              aria-label="Main Navigation">
              <NavItem to="/posts">Posts</NavItem>
              <Can action="read" subject="User">
                <NavItem to="/users">Users</NavItem>
              </Can>
              <Can action="manage" subject="all">
                <NavItem to="/access/roles">Access Control</NavItem>
              </Can>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                {user.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="h-7 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="sm:hidden border-b border-border bg-background px-4 py-1.5 flex items-center gap-1 overflow-x-auto">
        <NavItem to="/posts">Posts</NavItem>
        <Can action="read" subject="User">
          <NavItem to="/users">Users</NavItem>
        </Can>
        <Can action="manage" subject="all">
          <NavItem to="/access/roles">Access Control</NavItem>
        </Can>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
