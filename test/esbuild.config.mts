import {
  type BuildResult,
  type OnLoadArgs,
  type OnLoadResult,
  type OnResolveArgs,
  type OnResolveResult,
  type Plugin,
  type PluginBuild,
  type ResolveResult,
  build,
  version,
} from "esbuild";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getHeapStatistics } from "node:v8";

import { parseScenarioSelection } from "./src/parseScenarioSelection.ts";
import { selectScenarioNames } from "./src/selectScenarioNames.ts";

/**
 * Builds the test program and runs it: `src/index.ts` and the test files the
 * arguments select as entry points of one esbuild bundle, then the built
 * program in this process, so `node esbuild.config.mts <arguments>` runs the
 * same tests as `ttsx src/index.ts <arguments>`, with two differences of the
 * bundle: a test's `__dirname` is the built file's directory under
 * `bin/<process id>`, not its source's (a workspace package keeps its own,
 * `packageLocation`), and a dynamic `require` is esbuild's shim, which
 * refuses what it cannot resolve at build time. A test finds the repository
 * by `repositoryRoot` and a module's coverage by `moduleFunctionCoverage`,
 * which read the same under both; a source that requires a computed path
 * runs only under `pnpm test`.
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
 *
 * `AUTOMOVIE_TEST_ARTIFACT_DIR` opts into copying the unchanged output tree
 * to a new directory's `compiled/` before execution. Its parent must already
 * exist, and the destination cannot overlap `bin/`, whose normal cleanup
 * still runs. Metadata records the selected names, output hashes, esbuild
 * metafile and input-file hashes read after building. Those input hashes are
 * post-build snapshots, not proof of bytes read during a concurrent edit.
 * The same pre-execution record includes Node/V8, heap limits, profiling
 * flags and CPU/memory capacity so later latency reports name their host.
 * A failed copy leaves its partial evidence in place and runs no tests.
 *
 * `AUTOMOVIE_TEST_COVERAGE=1` turns esbuild's tree shaking off, so every
 * module a test imports keeps all its functions in the bundle and a coverage
 * reading (`src/coverage/reportUnitCoverage.ts`) counts the functions no test
 * reached instead of losing them from its totals.
 * `AUTOMOVIE_TEST_COVERAGE_SCOPE=package-components` limits the default
 * coverage selection to component tests named for Evidence-configured
 * packages.
 *
 * `AUTOMOVIE_TEST_BUILD_ONLY=1` additionally skips the test-program import
 * and requires that artifact directory. An absent flag or `0` keeps execution
 * enabled. Build-only reports `testsExecuted: false`; completing a build is
 * not a test pass. Neither option changes generated names or source bytes.
 */
const root: string = import.meta.dirname;
const runs: string = path.join(root, "bin");
const output: string = path.join(runs, String(process.pid));

/**
 * Leaves installed packages to Node and bundles the workspace's own sources.
 *
 * A workspace package resolves through its symlink to TypeScript under
 * `packages/`, which only a bundler can load; an installed package resolves
 * inside a `node_modules` directory and stays an import of that resolved
 * file, so native addons and packages with their own assets load as they do
 * under `ttsx`, and a package installed only beside the source importing it
 * still loads from the bundle's own directory.
 */
const installed: Plugin = {
  name: "installed-packages",
  setup(setup: PluginBuild): void {
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
        // A built-in stays its specifier. An installed package stays an
        // import of the file it resolved to from its importer: the bundle
        // runs from `bin/`, where the bare name may not resolve (a package
        // installed only beside the workspace source that imports it).
        if (resolved.external) return { path: args.path, external: true };
        return resolved.path.split(/[\\/]/).includes("node_modules")
          ? { path: pathToFileURL(resolved.path).href, external: true }
          : { path: resolved.path };
      },
    );
  },
};

/**
 * Keeps a workspace package's own location: a package that reads its files
 * relative to its source (`__dirname`, `__filename`), as `template` reads its
 * scaffold, reads them where they lie, not beside the bundle in `bin/`.
 *
 * Each such source under `packages/` reads both names from constants of its
 * own path, declared under names of its own so the bundle's banner, which
 * gives the tests and the runner their built location, keeps its two.
 */
const packageLocation: Plugin = {
  name: "package-location",
  setup(setup: PluginBuild): void {
    setup.onLoad(
      { filter: /[\\/]packages[\\/].*\.tsx?$/ },
      async (args: OnLoadArgs): Promise<OnLoadResult | undefined> => {
        if (args.path.split(/[\\/]/).includes("node_modules")) return undefined;
        const source: string = await fs.promises.readFile(args.path, "utf8");
        if (!/\b__(?:dirname|filename)\b/.test(source)) return undefined;
        return {
          contents: [
            `const __sourceFilename = ${JSON.stringify(args.path)};`,
            `const __sourceDirname = ${JSON.stringify(path.dirname(args.path))};`,
            source
              .replace(/\b__dirname\b/g, "__sourceDirname")
              .replace(/\b__filename\b/g, "__sourceFilename"),
          ].join("\n"),
          loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
          resolveDir: path.dirname(args.path),
        };
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
const alive: (pid: number) => boolean = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
};

/** Whether a directory equals or contains another resolved local path. */
function contains(directory: string, candidate: string): boolean {
  const relative: string = path.relative(directory, candidate);
  return relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." &&
      !relative.startsWith(`..${path.sep}`));
}

/**
 * Admit a new evidence directory under an existing real parent. Resolving the
 * parent also detects aliases into bin before any build or copy can recurse
 * into its own output or write evidence that normal cleanup would remove.
 */
function artifactDestination(value: string): string {
  if (value.trim().length === 0)
    throw new Error("AUTOMOVIE_TEST_ARTIFACT_DIR must name a new directory");
  const requested: string = path.resolve(value);
  const parent: string = fs.realpathSync(path.dirname(requested));
  const destination: string = path.join(parent, path.basename(requested));
  let binEntry: fs.Stats | undefined;
  try {
    binEntry = fs.lstatSync(runs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  // An existing bin can itself be a junction. A dangling one fails realpath
  // rather than being treated as a missing ordinary output directory.
  const generated: string = binEntry === undefined
    ? path.join(fs.realpathSync(root), "bin") : fs.realpathSync(runs);
  if (contains(generated, destination) || contains(destination, generated))
    throw new Error("The artifact directory must not overlap test/bin");
  try {
    fs.lstatSync(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return destination;
    throw error;
  }
  throw new Error(`The artifact directory already exists: ${destination}`);
}

/** SHA-256 of a file's current bytes, without modifying or importing it. */
function sha256(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/**
 * Copy a completed build before any test import. The new root is claimed
 * atomically, existing files are never replaced and no artifact is deleted.
 * Copy the ordinary output tree instead of moving it, so execution and exit
 * cleanup retain their original paths. Sidecars describe this pre-execution
 * snapshot; they are not a run result or a source-read trace.
 */
function preserveArtifacts(
  directory: string,
  built: BuildResult,
  selectedNames: readonly string[],
  buildOnly: boolean,
): void {
  if (built.metafile === undefined)
    throw new Error("Artifact preservation requires the build metafile");
  const outputs: { file: string; bytes: number; sha256: string }[] =
    Object.keys(built.metafile.outputs).map(
      (name: string): { file: string; bytes: number; sha256: string } => {
        const file: string = path.resolve(root, name);
        if (!contains(output, file))
          throw new Error(`A build output escapes its directory: ${name}`);
        return {
          file: path.relative(output, file),
          bytes: fs.statSync(file).size,
          sha256: sha256(file),
        };
      },
    );
  const inputs: { file: string; bytes: number; sha256: string }[] =
    Object.keys(built.metafile.inputs).map(
      (name: string): { file: string; bytes: number; sha256: string } => {
        const file: string = path.resolve(root, name);
        return {
          file: name,
          bytes: fs.statSync(file).size,
          sha256: sha256(file),
        };
      },
    );

  fs.mkdirSync(directory);
  fs.cpSync(output, path.join(directory, "compiled"), {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
  fs.writeFileSync(
    path.join(directory, "metafile.json"),
    JSON.stringify(built.metafile, null, 2),
    { flag: "wx" },
  );
  const processors: os.CpuInfo[] = os.cpus();
  fs.writeFileSync(
    path.join(directory, "build.json"),
    JSON.stringify({
      phase: "before-execution",
      mode: buildOnly ? "build-only" : "build-and-run",
      testsExecuted: false,
      capturedAt: new Date().toISOString(),
      esbuildVersion: version,
      runtime: {
        node: process.version,
        v8: process.versions.v8,
        platform: process.platform,
        architecture: process.arch,
        execArgv: [...process.execArgv],
        nodeOptions: process.env.NODE_OPTIONS ?? null,
        heapSizeLimitBytes: getHeapStatistics().heap_size_limit,
      },
      host: {
        logicalCpuCount: processors.length,
        availableParallelism: os.availableParallelism(),
        cpuModels: [...new Set(processors.map((cpu: os.CpuInfo): string => cpu.model))],
        totalMemoryBytes: os.totalmem(),
      },
      workingDirectory: root,
      originalOutputDirectory: output,
      selected: selectedNames,
      inputHashScope: "post-build file snapshots",
      inputs,
      outputs,
    }, null, 2),
    { flag: "wx" },
  );
}

const buildOnlyFlag: string | undefined = process.env.AUTOMOVIE_TEST_BUILD_ONLY;
if (buildOnlyFlag !== undefined && buildOnlyFlag !== "0" && buildOnlyFlag !== "1")
  throw new Error("AUTOMOVIE_TEST_BUILD_ONLY must be 0 or 1 when set");
const buildOnly: boolean = buildOnlyFlag === "1";
const artifactFlag: string | undefined = process.env.AUTOMOVIE_TEST_ARTIFACT_DIR;
if (buildOnly && artifactFlag === undefined)
  throw new Error("Build-only requires AUTOMOVIE_TEST_ARTIFACT_DIR");
const artifact: string | undefined = artifactFlag === undefined
  ? undefined : artifactDestination(artifactFlag);

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
const selection: ReturnType<typeof parseScenarioSelection> =
  parseScenarioSelection(process.argv.slice(2));
const coveragePackages: ReadonlySet<string> | undefined =
  process.env.AUTOMOVIE_TEST_COVERAGE_SCOPE === "package-components" &&
  selection.include.length === 0
    ? new Set(
        fs
          .globSync("*/evidence.config.ts", {
            cwd: path.join(root, "../packages"),
          })
          .map((file: string): string => path.basename(path.dirname(file))),
      )
    : undefined;
const selected: Set<string> = selectScenarioNames(
  selection,
  [...tests.keys()],
  coveragePackages === undefined
    ? undefined
    : (name: string): boolean => {
        const segments: string[] = path
          .relative("src/features", tests.get(name)!)
          .split(path.sep);
        return (
          segments.length === 3 &&
          coveragePackages.has(segments[0]!) &&
          name.startsWith(`test_${segments[0]}_`)
        );
      },
);

// Build metadata belongs to preparation, not the subsequent test import.
{
  const built: BuildResult = await build({
    absWorkingDir: root,
    entryPoints: [
      "src/index.ts",
      ...[...selected].map((name: string): string => tests.get(name)!),
    ],
    outdir: output,
    outbase: "src",
    outExtension: { ".js": ".mjs" },
    bundle: true,
    treeShaking: process.env.AUTOMOVIE_TEST_COVERAGE !== "1",

    // Shared code is emitted once as chunks, not once per test file.
    splitting: true,
    format: "esm",
    platform: "node",
    plugins: [installed, packageLocation],

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
    metafile: artifact !== undefined,
  });

  if (artifact !== undefined)
    preserveArtifacts(artifact, built, [...selected], buildOnly);
}
if (buildOnly)
  console.log(JSON.stringify({
    stage: "build-only-complete",
    artifactDirectory: artifact,
    selected: [...selected],
    testsExecuted: false,
  }));
else {
  // The built program selects again among the files built; given the
  // original terms, an exclude term whose files were never built would match
  // nothing there and be refused, so it is handed the selection by name.
  process.argv = [
    ...process.argv.slice(0, 2),
    ...[...selected].flatMap((name: string): string[] => ["--include", name]),
  ];
  await import(pathToFileURL(path.join(output, "index.mjs")).href);
}
