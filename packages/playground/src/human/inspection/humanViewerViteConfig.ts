/**
 * Development source transport for the existing Human inspection server. Exact aliases select checkout Human source, and the complete Human project owns its runtime transform; canonical package/test gates separately enforce their configured lint and type populations.
 *
 * One module instance retains compilation, source-resolution and watched-path state. The existing server factory passes this configuration as a value with configFile false; moving this declaration preserves its directory, options and evaluation order and does not update an already running server's loaded configuration.
 */
import { createHumanViewerCompilation } from "@automovie/viewer/human/inspection/createHumanViewerCompilation";
import { createHumanViewerCompileInputs } from "@automovie/viewer/human/inspection/createHumanViewerCompileInputs";
import { createHumanViewerSourceResolver } from "@automovie/viewer/human/inspection/createHumanViewerSourceResolver";
import { createHumanViewerTransform } from "@automovie/viewer/human/inspection/createHumanViewerTransform";
import { humanViewerInstance } from "@automovie/viewer/human/inspection/humanViewerInstance";
import { humanViewerLaunch } from "@automovie/viewer/human/inspection/humanViewerLaunch";
import { humanViewerStorage } from "@automovie/viewer/human/inspection/humanViewerStorage";
import { invalidateHumanViewerGeneration } from "@automovie/viewer/human/inspection/invalidateHumanViewerGeneration";
import { runHumanViewerCompile } from "@automovie/viewer/human/inspection/runHumanViewerCompile";
import { stampHumanViewerCompile } from "@automovie/viewer/human/inspection/stampHumanViewerCompile";
import { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type ModuleNode,
  type UserConfig,
  type ViteDevServer,
  defineConfig,
} from "vite";

import { humanViewerCompileGate } from "./humanViewerCompileGate.js";

const directory: string = path.dirname(fileURLToPath(import.meta.url));
// This configuration serves live checkout source. Packed runtime exports own
// a separate compiled-module contract and cannot stand in for source workers.
const runtimeEntry: string = fileURLToPath(
  import.meta
    .resolve("@automovie/viewer/human/inspection/createHumanViewerSource"),
);
if (!runtimeEntry.endsWith(".ts"))
  throw new Error(
    "Live Human inspection requires the declared workspace source entry.",
  );
const runtimeDirectory: string = path.dirname(runtimeEntry);
const human: string = path.resolve(directory, "../../../../../packages/human");
const outputDirectory: string = humanViewerStorage(
  path.resolve(directory, "../../../../.."),
  process.env.HUMAN_VIEWER_STORAGE_ROOT,
);
let server: ViteDevServer;
const served: ReturnType<typeof humanViewerInstance> = humanViewerInstance(
  process.env.HUMAN_VIEWER_PORT,
);
/** Whether a launcher owns the public port. */
const launched: boolean =
  process.env[humanViewerLaunch.ownerVariable] !== undefined;
// The transform runs in a child process: it is a synchronous call that takes
// tens of seconds, and inside this process it froze every request. Each
// viewer reports its own compilation, so a second viewer never overwrites it.
const status: string = path.join(outputDirectory, served.sourceStatus);
/** Each report belongs to this actual server creation, even when a PID is reused. */
const compilationProcessStartedAt: string | null = ProcessOwnership.read(
  process.pid,
);
if (compilationProcessStartedAt === null)
  throw new Error(
    "The compilation publisher has no process creation identity.",
  );
/** Workspace source imports resolved from cached listings instead of a realpath per import. */
const sourceResolver: ReturnType<typeof createHumanViewerSourceResolver> =
  createHumanViewerSourceResolver([
    path.resolve(directory, "../../../../../packages"),
    path.resolve(directory, "../../../../.."),
  ]);
/** Paths the compile inputs already added to the watcher. */
const watching: Set<string> = new Set<string>();
const inputs: ReturnType<typeof createHumanViewerCompileInputs> =
  createHumanViewerCompileInputs(human, [
    path.join(human, "tsconfig.json"),
    path.join(human, "package.json"),
    path.resolve(human, "../../pnpm-lock.yaml"),
  ]);
const compilation: ReturnType<typeof createHumanViewerCompilation> =
  createHumanViewerCompilation(
    async (): Promise<
      Awaited<ReturnType<typeof runHumanViewerCompile>>["files"]
    > => {
      const {
        files,
        watch,
        inputs: keys,
      }: Awaited<
        ReturnType<typeof runHumanViewerCompile>
      > = await runHumanViewerCompile({
        directory: runtimeDirectory,
        human,
        outputDirectory,
      });
      const began: number = performance.now();
      inputs.compiled(keys);
      // Only paths not yet watched are added: re-adding a thousand watched
      // files after every compile held the event loop for most of a second.
      const fresh: string[] = watch.filter(
        (file: string): boolean => !watching.has(file),
      );
      for (const file of fresh) watching.add(file);
      if (fresh.length !== 0) server.watcher.add(fresh);
      console.log(
        `COMPILE applied in ${Math.round(performance.now() - began)} ms, ${fresh.length} newly watched`,
      );
      return files;
    },
    (
      report: Parameters<
        NonNullable<Parameters<typeof createHumanViewerCompilation>[1]>
      >[0],
    ): void => {
      // The server reads this file for /health, since it cannot import this module's state.
      fs.mkdirSync(path.dirname(status), { recursive: true });
      fs.writeFileSync(
        status,
        JSON.stringify({
          ...report,
          pid: process.pid,
          processStartedAt: compilationProcessStartedAt,
        }),
      );
    },
  );
/**
 * Existing loopback Human inspection configuration: checkout-source aliases, canonical Human runtime transformation, candidate-controlled updates, disabled HMR/websocket and the caller's per-port ownership settings. The original vite.config.ts entry forwards this same object; createHumanViewerViteServer passes it as values with configFile false rather than asking Vite to reload its configuration.
 *
 * Module-owned compilation/source-resolution state and the set of discovered watched paths remain shared for this module instance; the set has no local count cap. Actual child compilation, source IO and server watcher lifetimes stay with their existing owners. This record describes requested configuration and does not prove a running server adopted it, source transformation succeeded or displayed geometry is healthy.
 */
export const humanViewerViteConfig: UserConfig = defineConfig({
  root: directory,
  plugins: [
    {
      name: sourceResolver.name,
      enforce: sourceResolver.enforce,
      resolveId: sourceResolver.resolveId,
    },
    {
      // An edit never reloads or hot-replaces a page a person is using: the
      // host page shows a banner and redraws when asked, keeping its state.
      name: "human-viewer-no-hot-update",
      handleHotUpdate: (): ModuleNode[] => [],
    },
    {
      ...createHumanViewerTransform(
        path.join(human, "src"),
        async (id: string): Promise<{ code: string } | undefined> => {
          const compiled: Awaited<ReturnType<typeof compilation.source>> =
            await compilation.source(id);
          return compiled === undefined
            ? undefined
            : {
                code: stampHumanViewerCompile(compiled.code, compiled.compile),
              };
        },
        (): void =>
          humanViewerCompileGate.withdraw((): void => {
            const seen: Set<ModuleNode> = new Set<ModuleNode>();
            invalidateHumanViewerGeneration(
              path.join(human, "src"),
              server.moduleGraph.idToModuleMap.values(),
              compilation.invalidate,
              (module: ModuleNode): void =>
                server.moduleGraph.invalidateModule(module, seen),
            );
          }),
        inputs.affects,
      ),
      configureServer: (instance: ViteDevServer): void => {
        server = instance;
        for (const event of ["add", "unlink", "addDir", "unlinkDir"] as const)
          server.watcher.on(event, sourceResolver.changed);
        server.watcher.add([
          path.join(human, "src"),
          path.join(human, "tsconfig.json"),
          path.resolve(human, "../../pnpm-lock.yaml"),
        ]);
      },
    },
  ],
  resolve: {
    alias: [
      { find: "/human-runtime", replacement: runtimeDirectory },
      {
        find: /^@automovie\/human$/,
        replacement: path.resolve(
          directory,
          "../../../../..",
          "packages/human/src/index.ts",
        ),
      },
      {
        find: /^@automovie\/human\/(.*)$/,
        replacement: path.resolve(
          directory,
          "../../../../..",
          "packages/human/src/$1",
        ),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["@automovie/human", "@automovie/engine", "@automovie/viewer"],
  },
  server: {
    host: "127.0.0.1",
    // Under a launcher the public port is the launcher's: this server takes a
    // free internal port, and the page's update socket goes through the
    // launcher on the public one.
    port: launched
      ? Number(process.env[humanViewerLaunch.internalVariable])
      : served.port,
    strictPort: true,
    // Display lifetime belongs to the viewer's candidate protocol, not HMR.
    hmr: false,
    ws: false,
    // Package-local tool output is not an authored compiler input. In
    // particular, evidence's disposable tsconfig must not trigger Vite's
    // built-in whole-page reload while a numerical model is being evaluated.
    watch: {
      ignored: ["**/packages/*/.tmp/**"],
    },
    fs: { allow: [path.resolve(directory, "../../../../..")] },
  },
});
