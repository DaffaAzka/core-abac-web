import { http } from "~/lib/http";
import {
  authResponseSchema,
  sessionResponseSchema,
  type AuthResponse,
  type SessionResponse,
  type SignInInput,
  type SignUpInput,
} from "./schemas";

export async function signIn(body: SignInInput): Promise<AuthResponse> {
  const res = await http.post("/auth/sign-in", body);
  return authResponseSchema.parse(res.data);
}

export async function signUp(body: SignUpInput): Promise<AuthResponse> {
  const res = await http.post("/auth/sign-up", body);
  return authResponseSchema.parse(res.data);
}

export async function signOut(): Promise<void> {
  await http.post("/auth/sign-out");
}

export async function getSession(): Promise<SessionResponse> {
  const res = await http.get("/auth/session");
  return sessionResponseSchema.parse(res.data);
}

/** Persist token returned by sign-in / sign-up */
export function storeToken(token: string | null | undefined): void {
  if (token) {
    localStorage.setItem("auth_token", token);
  }
}

export function clearToken(): void {
  localStorage.removeItem("auth_token");
}

export function getStoredToken(): string | null {
  return localStorage.getItem("auth_token");
}

