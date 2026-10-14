import { type ViteDevServer, createServer } from "vite";

import type { HumanViewerMiddleware } from "@automovie/viewer/human/inspection/HumanViewerMiddleware";

import viewerConfig from "./vite.config.js";

/**
 * Create the viewer's development server with the host's HTTP routes in front of Vite's own. The configuration is passed as a value, not as a config file: Vite restarts a server whose config file or any module it imports changes, and a restart replaces the file watcher the host subscribed to, so every later source edit would be silently lost while health still read current. Server-side viewer code takes effect when the server is started again.
 *
 * @evidence contracts/common.md#principled-implementation Passing the owned Vite configuration as values with configFile false preserves the server instance and its subscribed watcher, while middleware is registered before Vite routing.
 * @evidence contracts/common.md#clear-and-simple-design The application owns development configuration and the supplied Viewer middleware owns HTTP routes, without moving HTTP or asset policy into a separate server layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Config restart is disabled for the stated watcher-ownership requirement rather than hiding compilation failures; server-side source changes still require an explicit server restart.
 * @evidence contracts/common.md#meaningful-documentation The comment explains route precedence, config-as-value behavior, watcher continuity and restart responsibility for server-side code.
 * @evidence contracts/performance.md#efficient-algorithms Construction copies p configured plugin references and adds one route-registration plugin; Vite owns dependency scanning, transforms and watcher costs, which are not removed by this wrapper.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Server acquisition is an effect and this factory promises no reuse across mounts; the calling lifetime owns the one created server instance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned ViteDevServer transfers watcher and listening lifetime to its caller, which must invoke close on startup refusal and shutdown; this factory opens no independent timer or worker.
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
        configureServer: (server: ViteDevServer): void => {
          server.middlewares.use(middleware);
        },
      },
    ],
  });
}
