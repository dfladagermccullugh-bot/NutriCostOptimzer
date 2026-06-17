import { defineConfig } from "vitest/config";

// Logic tests run in plain Node — no DOM, and deliberately without the app's Vite plugins
// (react/tailwind/pwa) so the suite stays fast and isolated from build config.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
