/**
 * Development-only source transport. Exact aliases bypass human's browser
 * build condition. Only human calls typia in this browser's dependency graph,
 * so its complete package project owns the runtime transform. Canonical test
 * and workspace builds separately enforce all lint and type populations.
 * The production playground configuration is untouched.
 */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type ModuleNode, type ViteDevServer, defineConfig } from "vite";

import { createHumanViewerCompilation } from "./createHumanViewerCompilation";
import { createHumanViewerTransform } from "./createHumanViewerTransform";
import { humanViewerInstance } from "./humanViewerInstance";
import { invalidateHumanViewerGeneration } from "./invalidateHumanViewerGeneration";

const directory = path.dirname(fileURLToPath(import.meta.url));
const human = path.resolve(directory, "../../../packages/human");
const outputDirectory = path.resolve(directory, "../../../.shots/human-viewer");
interface IGraph {
  edges: Record<string, string[]>;
  globals: string[];
  configs: string[];
  candidates?: Record<string, string[]>;
  resolutionInputs?: string[];
}
let server: ViteDevServer;
const served = humanViewerInstance(process.env.HUMAN_VIEWER_PORT);
// The transform runs in a child process: it is a synchronous call that takes
// tens of seconds, and inside this process it froze every request. Each
// viewer reports its own compilation, so a second viewer never overwrites it.
const status = path.join(outputDirectory, served.sourceStatus);
const compilation = createHumanViewerCompilation(
  async () => {
    // Invalidations and config reloads can overlap children in the same process.
    // Artifact identity is independent of deterministic transformed source.
    const output = path.join(
      outputDirectory,
      `compile-${process.pid}-${randomUUID()}.json`,
    );
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await new Promise<undefined>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [path.join(directory, "compile-human.mts"), human, output],
        { windowsHide: true, stdio: "ignore" },
      );
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0
          ? resolve(undefined)
          : reject(new Error(`The human compile exited with ${code}`)),
      );
    });
    const result = JSON.parse(fs.readFileSync(output, "utf8")) as {
      files?: Record<string, string>;
      graph?: IGraph;
      error?: string;
    };
    fs.rmSync(output, { force: true });
    if (result.files === undefined)
      throw new Error(result.error ?? "The human compile failed");
    const files = Object.fromEntries(
      Object.entries(result.files).map(([file, source]) => [
        path.resolve(human, file).replaceAll("\\", "/"),
        source,
      ]),
    );
    const graph = result.graph;
    server.watcher.add([
      ...Object.keys(files),
      ...(graph === undefined
        ? []
        : [
            ...Object.keys(graph.edges),
            ...Object.values(graph.edges).flat(),
            ...graph.globals,
            ...graph.configs,
            ...Object.values(graph.candidates ?? {}).flat(),
            ...(graph.resolutionInputs ?? []),
          ].map((file) => path.resolve(human, file))),
    ]);
    return files;
  },
  (report) => {
    // The server reads this file for /health, since it cannot import this module's state.
    fs.mkdirSync(path.dirname(status), { recursive: true });
    fs.writeFileSync(status, JSON.stringify(report));
  },
);
export default defineConfig({
  root: directory,
  plugins: [
    {
      // An edit never reloads or hot-replaces a page a person is using: the
      // host page shows a banner and redraws when asked, keeping its state.
      name: "human-viewer-no-hot-update",
      handleHotUpdate: () => [],
    },
    {
      ...createHumanViewerTransform(
        path.join(human, "src"),
        async (id) => {
          const code = await compilation.source(id);
          return code === undefined ? undefined : { code };
        },
        () => {
          const seen = new Set<ModuleNode>();
          invalidateHumanViewerGeneration(
            path.join(human, "src"),
            server.moduleGraph.idToModuleMap.values(),
            compilation.invalidate,
            (module) => server.moduleGraph.invalidateModule(module, seen),
          );
        },
      ),
      configureServer: (instance) => {
        server = instance;
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
      {
        find: /^@automovie\/human$/,
        replacement: path.resolve(
          directory,
          "../../..",
          "packages/human/src/index.ts",
        ),
      },
      {
        find: /^@automovie\/human\/(.*)$/,
        replacement: path.resolve(
          directory,
          "../../..",
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
    port: served.port,
    strictPort: true,
    fs: { allow: [path.resolve(directory, "../../..")] },
  },
});
