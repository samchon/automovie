import { resolve } from "node:path";
import { type UserConfig, defineConfig } from "vite";

// GitHub Pages serves the site under the repository name, and that path is
// case-sensitive (currently `/automovie/`). A relative
// base keeps every asset URL correct wherever the build is mounted, so a
// repository rename or a local preview needs no rebuild.
/**
 * Relative asset base and the existing gallery, manor and tour build routes. Native uploader aliases point to authored source modules; Three is deduplicated so scene capability identity stays shared across the workspace bundle. This declaration configures the tool and does not establish a successful build or browser observation.
 *
 * One named configuration owns dev/preview ports, source resolution and site build entries; vite.config.ts reexports it as the tool-required default. Workspace filesystem access supports the manor's authored texture URLs. Vite owns build algorithms, dependency caching, watchers and server lifetime; this declaration acquires none of those runtime resources.
 */
export const websiteViteConfig: UserConfig = defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    // The manor package resolves through node_modules to experimental/, and
    // its texture URLs point back into that directory, so serve the workspace.
    fs: { allow: [resolve(__dirname, "..")] },
  },
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
  resolve: {
    dedupe: ["three"],
    extensions: [".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"],
    alias: {
      "production-temple-scene": resolve(
        __dirname,
        "../experimental/ancient-civic-temple/src/viewer/uploadTemple.ts",
      ),
      "production-temple-daylight": resolve(
        __dirname,
        "../experimental/ancient-civic-temple/src/viewer/createTempleDaylight.ts",
      ),
      "production-future-scene": resolve(
        __dirname,
        "../experimental/future-citizen-house/src/viewer/uploadHouse.ts",
      ),
      "production-future-daylight": resolve(
        __dirname,
        "../experimental/future-citizen-house/src/viewer/daylight.ts",
      ),
    },
  },
  build: {
    outDir: "dist",
    // The manor page carries three.js, the engine, and 144 KB of authored
    // source in one bundle; one chunk is the point, not an oversight.
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        manor: resolve(__dirname, "manor/index.html"),
        tour: resolve(__dirname, "tour/index.html"),
      },
    },
  },
});
