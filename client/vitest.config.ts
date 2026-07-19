import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  // tsconfig says jsx: "preserve" because Next owns the transform in the app
  // build. Vitest has no such step, so it needs the runtime named here or
  // every .tsx test fails with "React is not defined".
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Next inlines NEXT_PUBLIC_* at build time; under Vitest there is no Next
    // build, so the value has to be supplied here or `api` would be created
    // with a baseURL of the literal string "undefined/api/v1".
    env: { NEXT_PUBLIC_API_URL: "http://localhost:5000" },
  },
});
