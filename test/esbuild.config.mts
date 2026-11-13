import {
  type OnResolveArgs,
  type OnResolveResult,
  type Plugin,
  type ResolveResult,
  build,
} from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { parseScenarioSelection } from "./src/parseScenarioSelection.ts";
import { selectScenarioNames } from "./src/selectScenarioNames.ts";

/**
 * Builds the test program and runs it: `src/index.ts` and the test files the
 * arguments select as entry points of one esbuild bundle, then the built
 * program in this process, so `node esbuild.config.mts <arguments>` runs the
 * same program with the same arguments as `ttsx src/index.ts <arguments>`.
 *
 * Only the selected test files are built, by the program's own selection
 * rules, because building every test file costs more than running a few.
 *
 * Each run builds into a directory of its own, `bin/<process id>`, and
 * removes it when the process ends, so runs started at the same time in one
 * checkout never read each other's files. `bin/` is git-ignored and outside
 * `src`, because a compiled file beside a source is what Node would load
 * instead of it.
 *
 * The build type-checks and lints nothing; the type-check watch and CI's
 * `pnpm test` own that.
 */
const root: string = import.meta.dirname;
const runs: string = path.join(root, "bin");
const output: string = path.join(runs, String(process.pid));

/**
 * Leaves installed packages to Node and bundles the workspace's own sources.
 *
 * A workspace package resolves through its symlink to TypeScript under
 * `packages/`, which only a bundler can load; an installed package resolves
 * inside a `node_modules` directory and stays an import, so native addons
 * and packages with their own assets load as they do under `ttsx`.
 */
const installed: Plugin = {
  name: "installed-packages",
  setup(setup): void {
    const resolving: unique symbol = Symbol("resolving");
    setup.onResolve(
      { filter: /^[^./]/ },
      async (args: OnResolveArgs): Promise<OnResolveResult | undefined> => {
        // The nested resolve below reaches this hook again; let it through.
        if ((args.pluginData as symbol | undefined) === resolving)
          return undefined;
        const resolved: ResolveResult = await setup.resolve(args.path, {
          kind: args.kind,
          importer: args.importer,
          resolveDir: args.resolveDir,
          pluginData: resolving,
        });
        if (resolved.errors.length !== 0) return { errors: resolved.errors };
        return resolved.external ||
          resolved.path.split(/[\\/]/).includes("node_modules")
          ? { path: args.path, external: true }
          : { path: resolved.path };
      },
    );
  },
};

/**
 * Whether a process of this machine is still alive.
 *
 * @param pid The process id.
 * @returns `false` only when the system reports no such process.
 */
const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
};

// A killed run leaves its directory behind; the next run clears it.
if (fs.existsSync(runs))
  for (const name of fs.readdirSync(runs))
    if (/^\d+$/.test(name) && alive(Number(name)) === false)
      fs.rmSync(path.join(runs, name), { recursive: true, force: true });
process.on("exit", (): void =>
  fs.rmSync(output, { recursive: true, force: true }),
);

const tests: Map<string, string> = new Map(
  fs
    .globSync("src/features/**/test_*.ts", { cwd: root })
    .map((file: string): [string, string] => [path.parse(file).name, file]),
);
const selected: Set<string> = selectScenarioNames(
  parseScenarioSelection(process.argv.slice(2)),
  [...tests.keys()],
);

await build({
  absWorkingDir: root,
  entryPoints: [
    "src/index.ts",
    ...[...selected].map((name: string): string => tests.get(name)!),
  ],
  outdir: output,
  outbase: "src",
  outExtension: { ".js": ".mjs" },
  bundle: true,

  // Shared code is emitted once as chunks, not once per test file.
  splitting: true,
  format: "esm",
  platform: "node",
  plugins: [installed],

  // The sources are CommonJS and read these two names; an ES module has
  // neither, so each output file defines them from its own location.
  banner: {
    js: [
      `import { fileURLToPath as __toPath } from "node:url";`,
      `import { dirname as __toDirectory } from "node:path";`,
      `const __filename = __toPath(import.meta.url);`,
      `const __dirname = __toDirectory(__filename);`,
    ].join("\n"),
  },
  logLevel: "warning",
});

// The built program selects again among the files built; given the
// original terms, an exclude term whose files were never built would match
// nothing there and be refused, so it is handed the selection by name.
process.argv = [
  ...process.argv.slice(0, 2),
  ...[...selected].flatMap((name: string): string[] => ["--include", name]),
];
await import(pathToFileURL(path.join(output, "index.mjs")).href);
