import * as React from "react";
import { can, checkCached } from "./can";
import { useCurrentUser } from "~/features/auth";

/**
 * React hook to check permission against the backend ABAC API.
 * Uses cached decision when available; updates asynchronously.
 */
export function useCan(
  action: string,
  subject: string,
  attributes?: Record<string, unknown>
): boolean {
  const user = useCurrentUser();
  const cached = checkCached(action, subject, attributes);
  const [allowed, setAllowed] = React.useState<boolean>(cached ?? false);

  React.useEffect(() => {
    let cancelled = false;

    if (!user) {
      setAllowed(false);
      return;
    }

    can(action, subject, attributes).then((result) => {
      if (!cancelled) setAllowed(result);
    });

    return () => {
      cancelled = true;
    };
  }, [action, subject, JSON.stringify(attributes), user?.id]);

  return allowed;
}
