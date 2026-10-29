import { resolve } from "node:path";
import { type UserConfig, defineConfig } from "vite";

import { createHumanImagePlugin } from "../src/human-images/createHumanImagePlugin";
import { createCaptureSinkPlugin } from "./createCaptureSinkPlugin";

/** Configure the existing playground pages, capture sink and optional Human PNG service.
 * Loopback development uses port 5173; static preview uses 4173. The shared
 * execution operator owns GPU activity. Capture mode disables watching, and
 * public Human images exist only on the development server with an explicit
 * alias registry. Scratch tools and generated captures never enter the file
 * watcher: Windows can lock a newly written scratch file and otherwise end
 * the whole server with EBUSY. Dedicated diagnostic hosts retain source watching
 * but disable HMR navigation: the serialized worker explicitly reloads changed
 * model sources, and an interactive diagnostic page refreshes explicitly. Vite owns
 * bundling, source loading and server shutdown.
 */
export const playgroundViteConfig: UserConfig = defineConfig({
  plugins: [
    createCaptureSinkPlugin({ repository: resolve(__dirname, "../../..") }),
    createHumanImagePlugin(resolve(__dirname, "../../..")),
  ],
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
    ...(process.env.AUTOMOVIE_CAPTURE === "1" || process.env.AUTOMOVIE_HUMAN_DIAGNOSTIC_GATE_ID !== undefined ? { hmr: false } : {}),
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
