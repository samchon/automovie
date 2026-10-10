import { type ViteDevServer, createServer } from "vite";

import type { HumanViewerMiddleware } from "./HumanViewerMiddleware";

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
