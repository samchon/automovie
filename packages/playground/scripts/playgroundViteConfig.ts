import { resolve } from "node:path";
import { type UserConfig, defineConfig } from "vite";

import { createCaptureSinkPlugin } from "./createCaptureSinkPlugin";

/** Configure ordinary playground pages and their generic capture sink.
 * Loopback development uses port 5173; static preview uses 4173. The shared
 * execution operator owns GPU activity. Capture mode disables watching.
 * Human construction diagnostics belong to the unpublished Human dev app.
 * Scratch tools and generated captures never enter the file
 * watcher: Windows can lock a newly written scratch file and otherwise end
 * the whole server with EBUSY. Source changes retain normal HMR. Vite owns
 * bundling, source loading and server shutdown.
 * Large authored controls use default JSON imports. Vite's JSON.parse
 * transport keeps their nested arrays out of Rollup's object-literal AST;
 * the source files and their parsed numeric values remain unchanged.
 *
 * @see https://github.com/vitejs/vite/blob/v5.4.21/docs/config/shared-options.md#jsonstringify
 */
export const playgroundViteConfig: UserConfig = defineConfig({
  plugins: [
    createCaptureSinkPlugin({ repository: resolve(__dirname, "../../..") }),
  ],

  // Vite 5 disables named JSON exports in this mode. The imported controls
  // use default exports, so their readers retain the same object contract.
  json: { stringify: true },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored:
        process.env.AUTOMOVIE_CAPTURE === "1"
          ? ["**/*"]
          : ["**/.tmp/**", "**/.shots/**"],
    },
    ...(process.env.AUTOMOVIE_CAPTURE === "1" ? { hmr: false } : {}),
    fs: { allow: [resolve(__dirname, "../../..")] },
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "../index.html"),
        drivers: resolve(__dirname, "../drivers.html"),
        stickman: resolve(__dirname, "../stickman.html"),
        spar: resolve(__dirname, "../spar.html"),
        film: resolve(__dirname, "../film.html"),
        launch: resolve(__dirname, "../launch.html"),
        attach: resolve(__dirname, "../attach.html"),
        gesture: resolve(__dirname, "../gesture.html"),
        showcase: resolve(__dirname, "../showcase.html"),
        impact: resolve(__dirname, "../impact.html"),
        trampoline: resolve(__dirname, "../trampoline.html"),
        recovery: resolve(__dirname, "../recovery.html"),
        human: resolve(__dirname, "../human.html"),
      },
    },
  },
});
