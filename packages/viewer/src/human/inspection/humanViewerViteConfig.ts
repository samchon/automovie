import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UserConfig } from "vite";

import { humanViewerInstance } from "./humanViewerInstance.js";
import { humanViewerLaunch } from "./humanViewerLaunch.js";
import { readHumanViewerApplication } from "./readHumanViewerApplication.js";

const runtimeEntry: string = fileURLToPath(import.meta.url);
const application: Awaited<ReturnType<typeof readHumanViewerApplication>> =
  await readHumanViewerApplication();
const instance: ReturnType<typeof humanViewerInstance> = humanViewerInstance(
  process.env.HUMAN_VIEWER_PORT,
);

/**
 * Select the checkout's checked source transport or the installed package's emitted JavaScript transport. Both serve caller-owned pages; installed execution imports no development compiler and performs no runtime source generation.
 *
 * @evidence contracts/common.md#principled-implementation The executing module extension chooses source compilation versus emitted module loading; exact runtime aliases preserve the application's existing viewport URL.
 * @evidence contracts/common.md#clear-and-simple-design Development compiler ownership is isolated in a lazily imported configuration, while the installed path uses ordinary Vite module serving.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Installed execution does not relabel JavaScript as a checked TypeScript realm or silently select Playground content.
 * @evidence contracts/common.md#meaningful-documentation Documents mode selection, application ownership and the absence of runtime compilation in installed execution.
 * @evidence contracts/performance.md#efficient-algorithms Installed setup constructs fixed aliases/plugins and delegates dependency serving to Vite; source compilation retains its separate graph-sized costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Module evaluation shares one selected configuration and application binding per server process.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Configuration opens no server; createHumanViewerViteServer transfers the actual server lifetime to its caller.
 */
export async function humanViewerViteConfig(): Promise<UserConfig> {
  return runtimeEntry.endsWith(".ts")
  ? (await import("./humanViewerDevelopmentViteConfig.js"))
      .humanViewerDevelopmentViteConfig
  : {
      root: application.directory,
      plugins: [{ name: "human-viewer-no-hot-update", handleHotUpdate: (): [] => [] }],
      resolve: {
        alias: [
          {
            find: "/human-runtime/page.ts",
            replacement: path.join(path.dirname(runtimeEntry), "page.js"),
          },
          { find: "/human-runtime", replacement: path.dirname(runtimeEntry) },
        ],
      },
      optimizeDeps: { exclude: ["@automovie/human", "@automovie/engine", "@automovie/viewer"] },
      server: {
        host: "127.0.0.1",
        port: process.env[humanViewerLaunch.ownerVariable] === undefined
          ? instance.port
          : Number(process.env[humanViewerLaunch.internalVariable]),
        strictPort: true,
        hmr: false,
        ws: false,
        fs: { allow: [
          path.resolve(process.env.HUMAN_VIEWER_ROOT ?? process.cwd()),
          application.directory,
          path.dirname(runtimeEntry),
          ...["human", "engine", "interface", "viewer"].map(
            (name: string): string => path.dirname(fileURLToPath(
              import.meta.resolve(`@automovie/${name}`),
            )),
          ),
        ] },
      },
    };
}
