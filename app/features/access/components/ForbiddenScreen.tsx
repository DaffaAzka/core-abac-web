import * as React from "react";
import { Link } from "react-router";

interface ForbiddenScreenProps {
  message?: string;
  backTo?: string;
  backLabel?: string;
}

export function ForbiddenScreen({
  message = "You don't have permission to perform this action or view this resource.",
  backTo = "/posts",
  backLabel = "Back to posts",
}: ForbiddenScreenProps) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-7xl font-display font-bold text-destructive/20 select-none">403</span>
      <h1 className="mt-3 text-lg font-semibold text-foreground">Access denied</h1>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{message}</p>
      <div className="mt-6">
        <Link
          to={backTo}
          className="inline-flex h-8 items-center px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

