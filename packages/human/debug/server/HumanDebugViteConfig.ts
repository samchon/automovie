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
 * A page keeps the source it loaded until it is reloaded by hand or by a capture's own request:
 * Vite's update socket is off (`server.hmr: false`), so a save reaches no open page, and the
 * watcher still invalidates the served modules, so a reload loads the saved source. The watcher covers the
 * files the server serves, never the evidence and compiler folders a capture writes into. Vite
 * restarts the server itself when its configuration file or a module the configuration imports
 * changes (`vite.config.ts`, `debug/server`, `debug/contracts`, `debug/poses`).
 *
 * Vite strips the types and checks none; the viewer's collector, `ttsc --noEmit --watch -p
 * tsconfig.debug.json`, checks them, and the page and the image and batch routes report its latest
 * cycle.
 * Each port gets its own dependency cache, under the repository's `node_modules` so that its
 * rewrites never reach the collectors' watch on the package, and several viewers run side by side.
 */
export const HumanDebugViteConfig: UserConfig = defineConfig({
  root: DIRECTORY,
  // The dependency cache lives outside the package: a re-optimization rewrites it, and the compile
  // collectors watch the package directory.
  cacheDir: path.join(ENVIRONMENT.repository, "node_modules", ".vite-human-debug-" + ENVIRONMENT.port),
  optimizeDeps: { noDiscovery: true, include: ["three", "tstl"], entries: [HUMAN_DEBUG_ROUTES.page.slice(1)] },
  plugins: [createHumanDebugPlugin(ENVIRONMENT)],
  server: {
    host: "127.0.0.1",
    port: ENVIRONMENT.port,
    strictPort: true,
    open: false,
    // No update socket: a save reloads no open page; a reload by hand or a
    // capture's own request loads the saved source.
    hmr: false,
    fs: { allow: [ENVIRONMENT.repository] },
    watch: { ignored: ["**/.tmp/**", "**/.shots/**", "**/.ttsc/**", "**/dev/**", "**/lib/**", "**/docs/**", "**/*.md"] },
  },
});
