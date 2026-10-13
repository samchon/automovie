import { type ViteDevServer, createServer } from "vite";

import type { HumanViewerMiddleware } from "@automovie/viewer/human/inspection/HumanViewerMiddleware";

import viewerConfig from "./vite.config.mjs";

/**
 * Create the viewer's development server with the host's HTTP routes in
 * front of Vite's own. The configuration is passed as a value, not as a
 * config file: Vite restarts a server whose config file or any module it
 * imports changes, and a restart replaces the file watcher the host
 * subscribed to, so every later source edit would be silently lost while
 * health still read current. Server-side viewer code takes effect when the
 * server is started again.
 *
 * @evidence contracts/common.md#principled-implementation The watcher the host subscribes to lives as long as the server.
 * @evidence contracts/common.md#clear-and-simple-design One normal server composition retains the supplied config value and prepends the host's middleware while keeping the existing plugins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses Vite's supported configFile and configureServer inputs; no private watcher mutation or timed restart substitutes for the host's original subscription lifetime.
 * @evidence contracts/common.md#meaningful-documentation States why no config file is used.
 */
export function createHumanViewerViteServer(
  middleware: HumanViewerMiddleware,
): Promise<ViteDevServer> {
  return createServer({
    ...viewerConfig,
    configFile: false,
    plugins: [
      ...(viewerConfig.plugins ?? []),
      {
        name: "human-viewer-http",
        configureServer: (server) => {
          server.middlewares.use(middleware);
        },
      },
    ],
  });
}
