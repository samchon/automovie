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
 * a reload requests modules from the running server. Its watcher is intended to invalidate served
 * files, but disk hash equality does not prove workspace dependency transforms are fresh; compare
 * actual served exports/bytes when investigating that boundary. The watcher ignores evidence and
 * compiler folders a capture writes into. In the installed
 * Vite 5.4, `hmr: false` also suppresses the config-change server-restart handler. Page-module
 * invalidation therefore does not reload the server's CaptureSession implementation; server code
 * needs a normal server restart, separately from a page reload.
 *
 * Vite strips the types and checks none; the viewer's collector, `ttsc --noEmit --watch -p
 * tsconfig.debug.json`, checks them, and the page and the image and batch routes report its latest
 * cycle.
 * The dependency cache is scoped by port under the repository's `node_modules`, outside the
 * collectors' package watch. The shared workflow uses the single viewer on port 5197.
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
    // No update socket: a save reloads no open page; a manual or capture reload
    // requests the running server's modules, whose transform freshness is a separate boundary.
    hmr: false,
    fs: { allow: [ENVIRONMENT.repository] },
    watch: { ignored: ["**/.tmp/**", "**/.shots/**", "**/.ttsc/**", "**/dev/**", "**/lib/**", "**/docs/**", "**/*.md"] },
  },
});
