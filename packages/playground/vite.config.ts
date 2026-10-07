import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // This linked package is rebuilt through typia's compiler transform. Do not
  // retain an optimized copy of yesterday's region inventory after a rebuild.
  optimizeDeps: { exclude: ["@automovie/human"] },
  plugins: [
    {
      name: "watch-linked-human-output",
      configureServer: (server) => {
        // The package build removes lib before re-emitting it. Watching only
        // the imported files loses their replacements after that directory is
        // deleted; the surviving package parent reports the new tree as well.
        server.watcher.add(resolve(__dirname, "../human"));
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    fs: { allow: [resolve(__dirname, "../..")] },
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  // The human editors share one worker entry that loads its role on demand;
  // module format lets the bundler split those roles into chunks.
  worker: { format: "es" },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        drivers: resolve(__dirname, "drivers.html"),
        stickman: resolve(__dirname, "stickman.html"),
        knight: resolve(__dirname, "knight.html"),
        spar: resolve(__dirname, "spar.html"),
        film: resolve(__dirname, "film.html"),
        launch: resolve(__dirname, "launch.html"),
        attach: resolve(__dirname, "attach.html"),
        gesture: resolve(__dirname, "gesture.html"),
        showcase: resolve(__dirname, "showcase.html"),
        archery: resolve(__dirname, "archery.html"),
        impact: resolve(__dirname, "impact.html"),
        trampoline: resolve(__dirname, "trampoline.html"),
        face: resolve(__dirname, "face.html"),
        connectedFace: resolve(__dirname, "connected-face.html"),
        connectedBody: resolve(__dirname, "connected-body.html"),
        connectedBodyAnatomical: resolve(__dirname, "connected-body-anatomical.html"),
        connectedPerson: resolve(__dirname, "connected-person.html"),
      },
    },
  },
});
