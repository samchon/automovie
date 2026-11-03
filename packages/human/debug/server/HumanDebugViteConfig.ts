import path from "node:path";
import { type UserConfig, defineConfig } from "vite";

import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugEnvironment } from "./HumanDebugEnvironment";
import type { IHumanDebugEnvironment } from "./IHumanDebugEnvironment";
import { createHumanDebugPlugin } from "./createHumanDebugPlugin";

/** The Human package directory, two levels above this file. */
const DIRECTORY: string = path.resolve(__dirname, "../..");

/** The environment the server runs with. */
const ENVIRONMENT: IHumanDebugEnvironment = HumanDebugEnvironment(DIRECTORY);

/**
 * The Vite configuration of the debug viewer, served from the Human package directory.
 *
 * An open page never refreshes: there is no hot module replacement (`hmr: false`) and no WebSocket
 * server (`ws: false`), so no update, reload or event ever reaches a page, and a saved file changes
 * nothing in an open page or a running capture. The file watcher only invalidates Vite's module
 * cache, so the next page load reads the current source; it watches the files the server serves,
 * never the evidence and compiler folders a capture writes into. The server restarts only when its
 * own configuration modules change (`debug/server`, `debug/contracts`), never for a library `src`
 * file, which the configuration does not import.
 *
 * Vite strips the types of every module and checks none, so a type or lint error anywhere never
 * stops a page or a frame; the separate `ttsc --watch -p tsconfig.debug.json` reports them. Each
 * port gets its own dependency cache so several viewers run side by side.
 */
export const HumanDebugViteConfig: UserConfig = defineConfig({
  root: DIRECTORY,
  cacheDir: path.join(DIRECTORY, "node_modules", ".vite-debug-" + ENVIRONMENT.port),
  optimizeDeps: { noDiscovery: true, include: ["three", "tstl"], entries: [HUMAN_DEBUG_ROUTES.page.slice(1)] },
  plugins: [createHumanDebugPlugin(ENVIRONMENT)],
  server: {
    host: "127.0.0.1",
    port: ENVIRONMENT.port,
    strictPort: true,
    open: false,
    hmr: false,
    ws: false,
    fs: { allow: [ENVIRONMENT.repository] },
    watch: { ignored: ["**/.tmp/**", "**/.shots/**", "**/.ttsc/**", "**/dev/**", "**/lib/**", "**/docs/**", "**/*.md"] },
  },
});
