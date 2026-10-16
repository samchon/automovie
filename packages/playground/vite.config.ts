import { resolve } from "path";
import { defineConfig } from "vite";

import { createCaptureSinkPlugin } from "./scripts/createCaptureSinkPlugin";

export default defineConfig({
  plugins: [
    createCaptureSinkPlugin({ repository: resolve(__dirname, "../..") }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // A capture's server is a snapshot: it neither watches files nor reloads the page, so another edit or build cannot interrupt a run.
    ...(process.env.AUTOMOVIE_CAPTURE === "1"
      ? { hmr: false, watch: { ignored: ["**/*"] } }
      : {}),
    fs: { allow: [resolve(__dirname, "../..")] },
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        drivers: resolve(__dirname, "drivers.html"),
        stickman: resolve(__dirname, "stickman.html"),
        spar: resolve(__dirname, "spar.html"),
        film: resolve(__dirname, "film.html"),
        launch: resolve(__dirname, "launch.html"),
        attach: resolve(__dirname, "attach.html"),
        gesture: resolve(__dirname, "gesture.html"),
        showcase: resolve(__dirname, "showcase.html"),
        impact: resolve(__dirname, "impact.html"),
        trampoline: resolve(__dirname, "trampoline.html"),
        human: resolve(__dirname, "human.html"),
      },
    },
  },
});
