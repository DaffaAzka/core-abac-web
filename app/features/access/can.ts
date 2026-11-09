import { checkPermission } from "./api";

// Simple in-memory cache for permission decisions: key -> boolean
const permissionCache = new Map<string, { allowed: boolean; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

function makeKey(action: string, subject: string, attributes?: Record<string, unknown>): string {
  return `${action}:${subject}:${JSON.stringify(attributes ?? {})}`;
}

/**
 * Checks permission against the backend ABAC/CASL engine (`POST /access/check`).
 * The backend is the single source of truth for authorization decisions.
 */
export async function can(
  action: string,
  subject: string,
  attributes?: Record<string, unknown>
): Promise<boolean> {
  const key = makeKey(action, subject, attributes);
  const cached = permissionCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.allowed;
  }

  try {
    const res = await checkPermission({
      action,
      subject,
      attributes,
    });
    permissionCache.set(key, { allowed: res.allowed, timestamp: now });
    return res.allowed;
  } catch {
    // Fail closed on error, but do not cache failure
    return false;
  }
}

/** Clears the permission cache (e.g. on role change or sign out) */
export function invalidatePermissionCache(): void {
  permissionCache.clear();
}

/** Synchronous check against the cache if available */
export function checkCached(
  action: string,
  subject: string,
  attributes?: Record<string, unknown>
): boolean | undefined {
  const key = makeKey(action, subject, attributes);
  const cached = permissionCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.allowed;
  }
  return undefined;
}

