import { resolve } from "node:path";
import { defineConfig } from "vite";

// Separate build for the CDN <script> tag consumer: a single global
// `window.OnboardFlow` bound directly to the SDK instance (not a
// named-exports namespace object, which is what the main es/cjs build
// produces and what a <script src> user should never have to unwrap).
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/cdn-entry.ts"),
      name: "OnboardFlow",
      formats: ["iife"],
      fileName: () => "onboardflow.iife.js",
    },
    sourcemap: true,
  },
});
