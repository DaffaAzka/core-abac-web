import * as React from "react";
import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/auth-layout";
import { getSession, getStoredToken } from "../api";

export async function clientLoader(): Promise<null> {
  const token = getStoredToken();
  if (token) {
    try {
      const session = await getSession();
      if (session.user) {
        throw redirect("/posts");
      }
    } catch (err) {
      if ((err as { status?: number }).status !== 401) throw err;
    }
  }
  return null;
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}

