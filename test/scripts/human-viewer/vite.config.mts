/**
 * Development-only source transport. Exact aliases bypass human's browser
 * build condition. Only human calls typia in this browser's dependency graph,
 * so its complete package project owns the runtime transform. Canonical test
 * and workspace builds separately enforce all lint and type populations.
 * The production playground configuration is untouched.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TtscCompiler } from "ttsc";
import { type ViteDevServer, defineConfig } from "vite";

import { createHumanViewerCompilation } from "./createHumanViewerCompilation";
import { createHumanViewerTransform } from "./createHumanViewerTransform";

const directory = path.dirname(fileURLToPath(import.meta.url));
const human = path.resolve(directory, "../../../packages/human");
let server: ViteDevServer;
const compiler = new TtscCompiler({
  cwd: human,
  tsconfig: path.join(human, "tsconfig.json"),
  plugins: [{ transform: "typia/lib/transform" }],
});
const compilation = createHumanViewerCompilation(() => {
  const result = compiler.transform();
  if (result.type !== "success") throw new Error(JSON.stringify(result));
  const files = Object.fromEntries(
    Object.entries(result.typescript).map(([file, source]) => [
      path.resolve(human, file).replace(/\\/g, "/"),
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
});
export default defineConfig({
  root: directory,
  plugins: [
    {
      ...createHumanViewerTransform(
        path.join(human, "src"),
        async (id) => {
          const code = compilation.source(id);
          return code === undefined ? undefined : { code };
        },
        compilation.invalidate,
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
    port: 5175,
    strictPort: true,
    fs: { allow: [path.resolve(directory, "../../..")] },
  },
});
