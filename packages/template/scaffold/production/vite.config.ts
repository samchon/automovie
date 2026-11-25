import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Scratch names belong to this production, including when its parent uses one. */
const productionRoot: string = fileURLToPath(new URL(".", import.meta.url));

/**
 * Linked SDKs resolve to TypeScript and would otherwise load one module per
 * request.
 */
const linkedSdk: string[] = [
  "@automovie/engine",
  "@automovie/motions",
  "@automovie/render",
  "@automovie/viewer",
].filter((id: string): boolean => import.meta.resolve(id).endsWith(".ts"));

/**
 * The production's inspector page; generated evidence and capture scratch never
 * reload it. `automovie capture`, `render` and `inspect` build their own pages
 * with this configuration.
 */
export default defineConfig({
  resolve: {
    // Published SDK CommonJS imports must share the browser's ESM Three.js;
    // Three.js's require entry emits a Node-only process warning.
    alias: [
      {
        find: /^three$/,
        replacement: fileURLToPath(import.meta.resolve("three")),
      },
    ],
  },
  optimizeDeps: {
    include: linkedSdk,
    // A linked SDK can change without touching the production's lockfile.
    force: linkedSdk.length !== 0,
  },
  build: {
    target: "es2022",
    // Preserve lazy initialization across the published SDK's require cycles.
    commonjsOptions: { strictRequires: true },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      /**
       * Match scratch components inside the project; ancestor names cannot hide
       * source.
       */
      ignored: (file: string): boolean => {
        const local: string = relative(
          productionRoot,
          resolve(productionRoot, file),
        );
        if (isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`))
          return false;
        return local
          .split(sep)
          .some(
            (component: string): boolean =>
              component === ".tmp" ||
              component === ".cache" ||
              component === "media",
          );
      },
    },
  },
});
