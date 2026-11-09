import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: the API is a separate service, no server-side rendering needed
  ssr: false,
} satisfies Config;
