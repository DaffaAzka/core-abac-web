import { useCallback, useSyncExternalStore } from "react";
import type { CurrentUser } from "./schemas";

// ---------------------------------------------------------------------------
// Simple synchronous session store backed by localStorage + React external store
// ---------------------------------------------------------------------------

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser; token: string }
  | { status: "unauthenticated" };

let state: SessionState = { status: "loading" };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const sessionStore = {
  getSnapshot(): SessionState {
    return state;
  },

  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  setAuthenticated(user: CurrentUser, token: string): void {
    state = { status: "authenticated", user, token };
    notify();
  },

  setUnauthenticated(): void {
    state = { status: "unauthenticated" };
    notify();
  },

  setLoading(): void {
    state = { status: "loading" };
    notify();
  },
};

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, () => ({
    status: "loading" as const,
  }));
}

export function useCurrentUser(): CurrentUser | null {
  const session = useSession();
  return session.status === "authenticated" ? session.user : null;
}

