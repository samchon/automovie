import { defineConfig } from "vite";

/** Bundle the same public capture APIs for the workspace's source-linked ESM packages. */
export default defineConfig({
  ssr: {
    noExternal: [
      "@automovie/viewer",
      "@automovie/render",
      "@automovie/engine",
      "@automovie/interface",
    ],
  },
  build: {
    ssr: "scripts/capture.ts",
    outDir: ".capture",
    target: "node22",
    rollupOptions: { output: { entryFileNames: "capture.mjs" } },
  },
});
