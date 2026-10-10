import { resolve } from "node:path";
import { defineConfig } from "vite";

// GitHub Pages serves the site under the repository name, and that path is
// case-sensitive (currently `/automovie/`). A relative
// base keeps every asset URL correct wherever the build is mounted, so a
// repository rename or a local preview needs no rebuild.
export default defineConfig({
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
    extensions: [".mts", ".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"],
    alias: {
      "production-temple-scene": resolve(
        __dirname,
        "../experimental/ancient-civic-temple/src/viewer/scene.ts",
      ),
      "production-temple-daylight": resolve(
        __dirname,
        "../experimental/ancient-civic-temple/src/viewer/daylight.ts",
      ),
      "production-future-scene": resolve(
        __dirname,
        "../experimental/future-citizen-house/src/viewer/scene.ts",
      ),
      "production-future-daylight": resolve(
        __dirname,
        "../experimental/future-citizen-house/src/viewer/illumination.ts",
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
