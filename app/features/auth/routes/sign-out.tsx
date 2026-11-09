import { redirect } from "react-router";
import type { Route } from "./+types/sign-out";
import { signOut, clearToken } from "../api";
import { sessionStore } from "../session";
import { invalidatePermissionCache } from "~/features/access";

export async function clientAction(): Promise<Response> {
  try {
    await signOut();
  } catch {
    // Session cleanup is best effort
  }
  clearToken();
  invalidatePermissionCache();
  sessionStore.setUnauthenticated();
  return redirect("/sign-in");
}

export async function clientLoader(): Promise<Response> {
  return redirect("/sign-in");
}

export default function SignOutPage() {
  return null;
}

