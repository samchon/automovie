import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Scratch names belong to this production, including when its parent uses one. */
const productionRoot: string = fileURLToPath(new URL(".", import.meta.url));

/** Running production viewer and its draw-only page; generated evidence and capture scratch never reload them. */
export default defineConfig({
  build: {
    target: "es2022",
    // Two pages: the Viewer, and the draw-only page every capture and delivery draws through.
    rollupOptions: {
      input: {
        main: resolve(productionRoot, "index.html"),
        render: resolve(productionRoot, "render/index.html"),
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      /** Match scratch components inside the project; ancestor names cannot hide source. */
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
