import ttsc from "@ttsc/unplugin/vite";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // `@automovie/human` is consumed as TypeScript source whose admission calls
  // typia; only ttsc applies typia's transform, so Vite must run it too.
  plugins: [ttsc({ project: resolve(__dirname, "../human/tsconfig.json") })],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
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
