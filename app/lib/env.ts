/**
 * Validated environment variables.
 * Add new vars here and they propagate everywhere in the app.
 */
const raw = {
  VITE_API_URL: import.meta.env["VITE_API_URL"] as string | undefined,
};

function required(key: keyof typeof raw): string {
  const val = raw[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  /** Base URL of the find-cat-ely API, e.g. http://localhost:3000 */
  apiUrl: raw["VITE_API_URL"] ?? "http://localhost:3000",
} as const;

export type Env = typeof env;

