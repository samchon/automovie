import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import fs from "node:fs";
import type { Profiler } from "node:inspector";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "../features/internal/repositoryRoot";
import type { IModuleCoverage } from "./IModuleCoverage";
import { listUnloadedCoverage } from "./listUnloadedCoverage";
import { measureModuleCoverage } from "./measureModuleCoverage";

/** The options this report takes before the runner's own selection. */
interface IOptions {
  /** The directories whose modules are reported, absolute, forward slashes. */
  roots: string[];

  /** Where to write the whole report as JSON, or null. */
  json: string | null;

  /** Whether to print each module's unreached functions and arms. */
  missed: boolean;

  /** The selection handed to the test runner. */
  selection: string[];
}

/** One V8 coverage file's content. */
interface IV8Coverage {
  /** The scripts the process loaded. */
  result: Profiler.ScriptCoverage[];
}

/** The pre-execution record the runner writes beside a preserved build. */
interface IBuildRecord {
  /** The directory the tests ran from, which the coverage's URLs name. */
  originalOutputDirectory: string;
}

/**
 * Function and branch coverage of package directories by the selected tests,
 * using package component tests by default. Run
 * `pnpm test:coverage --root <path> [--root <path>...]
 * [--missed] [--json <file>] [--include <terms>...] [--exclude <terms>...]`,
 * each root a directory or a file relative to the repository.
 *
 * The tests run once through the bundled runner (`esbuild.config.mts`), with
 * esbuild's tree shaking off so every module a test imports keeps all its
 * functions, the build preserved before execution
 * (`AUTOMOVIE_TEST_ARTIFACT_DIR`) and V8's block coverage written at exit
 * (`NODE_V8_COVERAGE`). Each chunk's coverage is attributed to the modules it
 * holds (`measureModuleCoverage`); a module under a root that no chunk holds
 * counts every function and arm unreached (`listUnloadedCoverage`). Without an
 * `--include` the runner selects component tests named for their owning
 * package when that package has an Evidence configuration.
 *
 * The report lists each module with targets, sorted by path, its reached
 * functions and branch arms over their totals, then each root's totals. The
 * process exits with the runner's status, so a failing test fails the report
 * too; the temporary build and coverage are removed either way.
 */
function main(): void {
  const options: IOptions = parse(process.argv.slice(2));
  const root: string = repositoryRoot();
  const tests: string = path.join(root, "test");
  const scratch: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-coverage-"),
  );
  try {
    const v8: string = path.join(scratch, "v8");
    const build: string = path.join(scratch, "build");
    const run: SpawnSyncReturns<Buffer> = spawnSync(
      process.execPath,
      ["esbuild.config.mts", ...options.selection],
      {
        cwd: tests,
        stdio: "inherit",
        env: {
          ...runnerEnvironment(),
          NODE_V8_COVERAGE: v8,
          AUTOMOVIE_TEST_ARTIFACT_DIR: build,
          AUTOMOVIE_TEST_COVERAGE: "1",
          AUTOMOVIE_TEST_COVERAGE_SCOPE: "package-components",
        },
      },
    );
    const modules: IModuleCoverage[] = collect(options, tests, v8, build);
    print(options, root, modules);
    if (options.json !== null)
      fs.writeFileSync(
        options.json,
        JSON.stringify({ roots: options.roots, modules }, null, 2),
      );
    process.exitCode = run.status ?? 1;
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * This process's environment without the source loader ttsx put on
 * `NODE_OPTIONS`: ttsx records the value it received and the one it gave in
 * `TTSX_NODE_OPTIONS_RECORD` as `[received, given]`, and while the given value
 * is still in force the received one is restored, so the runner loads its
 * `.mts` config by Node's own type stripping and the bundle as plain modules.
 */
function runnerEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const record: string | undefined = env.TTSX_NODE_OPTIONS_RECORD;
  if (record === undefined) return env;
  const [received, given]: [string, string] = JSON.parse(record);
  if (env.NODE_OPTIONS === given)
    if (received.trim() === "") delete env.NODE_OPTIONS;
    else env.NODE_OPTIONS = received;
  delete env.TTSX_NODE_OPTIONS_RECORD;
  return env;
}

/** Coverage options and the remaining test runner arguments. */
function parse(argv: readonly string[]): IOptions {
  const options: IOptions = {
    roots: [],
    json: null,
    missed: false,
    selection: [],
  };
  for (let i: number = 0; i < argv.length; ++i) {
    const argument: string = argv[i]!;
    if (argument === "--root" || argument === "--json") {
      const value: string | undefined = argv[++i];
      if (value === undefined) throw new Error(`${argument} needs a path`);
      if (argument === "--json")
        options.json = path.resolve(repositoryRoot(), value);
      else options.roots.push(normal(path.resolve(repositoryRoot(), value)));
    } else if (argument === "--missed") options.missed = true;
    else options.selection.push(argument);
  }
  if (options.roots.length === 0)
    throw new Error("Name at least one --root directory to report");
  return options;
}

/** Every module under the roots, read from the run's coverage. */
function collect(
  options: IOptions,
  tests: string,
  v8: string,
  build: string,
): IModuleCoverage[] {
  const merged: Map<string, IModuleCoverage> = new Map();
  const inScope: (comment: string) => string | null = (
    comment: string,
  ): string | null => {
    const file: string = normal(path.resolve(tests, comment));
    return options.roots.some((r: string): boolean => within(r, file))
      ? file
      : null;
  };
  const record: string = path.join(build, "build.json");
  if (fs.existsSync(record) && fs.existsSync(v8)) {
    const built: IBuildRecord = JSON.parse(fs.readFileSync(record, "utf8"));
    const prefix: string = pathToFileURL(built.originalOutputDirectory).href;
    for (const name of fs.readdirSync(v8)) {
      const coverage: IV8Coverage = JSON.parse(
        fs.readFileSync(path.join(v8, name), "utf8"),
      );
      for (const script of coverage.result) {
        if (!script.url.startsWith(`${prefix}/`)) continue;
        const relative: string = decodeURIComponent(
          script.url.slice(prefix.length + 1),
        );
        const chunk: string = fs.readFileSync(
          path.join(build, "compiled", relative),
          "utf8",
        );
        for (const module of measureModuleCoverage(
          chunk,
          script.functions,
          inScope,
        ))
          merge(merged, module);
      }
    }
  }
  for (const r of options.roots)
    for (const file of sources(r))
      if (!merged.has(file)) {
        const module: IModuleCoverage = listUnloadedCoverage(file);
        if (module.functions.length + module.branches.length !== 0)
          merged.set(file, module);
      }
  return [...merged.values()]
    .filter(
      (module: IModuleCoverage): boolean =>
        module.functions.length + module.branches.length !== 0,
    )
    .sort((a: IModuleCoverage, b: IModuleCoverage): number =>
      a.file < b.file ? -1 : a.file > b.file ? 1 : 0,
    );
}

/** Add one reading of a module, reaching an arm when either reading did. */
function merge(
  merged: Map<string, IModuleCoverage>,
  module: IModuleCoverage,
): void {
  const known: IModuleCoverage | undefined = merged.get(module.file);
  if (known === undefined) {
    merged.set(module.file, module);
    return;
  }
  for (const key of ["functions", "branches"] as const)
    if (known[key].length === module[key].length)
      module[key].forEach(
        (target: IModuleCoverage.ITarget, i: number): void => {
          if (target.covered) known[key][i]!.covered = true;
        },
      );
}

/** Whether a file is a root or lies under it. */
function within(root: string, file: string): boolean {
  return file === root || file.startsWith(`${root}/`);
}

/**
 * Every TypeScript source a root names, without declarations: the file itself
 * or every file under the directory.
 */
function sources(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  if (fs.statSync(directory).isFile()) return [directory];
  return fs
    .readdirSync(directory, { recursive: true, encoding: "utf8" })
    .map((relative: string): string => normal(path.join(directory, relative)))
    .filter(
      (file: string): boolean =>
        /\.tsx?$/u.test(file) &&
        !file.endsWith(".d.ts") &&
        !file.includes("/node_modules/"),
    );
}

/** Print the modules and each root's totals. */
function print(
  options: IOptions,
  root: string,
  modules: readonly IModuleCoverage[],
): void {
  const share: (targets: readonly IModuleCoverage.ITarget[]) => string = (
    targets: readonly IModuleCoverage.ITarget[],
  ): string => {
    const reached: number = targets.filter(
      (target: IModuleCoverage.ITarget): boolean => target.covered,
    ).length;
    const rate: string =
      targets.length === 0
        ? "   -  "
        : `${((100 * reached) / targets.length).toFixed(1).padStart(5)}%`;
    return `${`${reached}/${targets.length}`.padStart(9)} ${rate}`;
  };
  const top: string = normal(root);
  console.log("\n        functions          branches   module");
  for (const module of modules) {
    console.log(
      `${share(module.functions)}  ${share(module.branches)}   ${path.posix.relative(top, module.file)}${module.loaded ? "" : " (not loaded)"}`,
    );
    if (options.missed)
      for (const target of [...module.functions, ...module.branches])
        if (!target.covered) console.log(`      missed ${target.name}`);
  }
  for (const r of options.roots) {
    const under: IModuleCoverage[] = modules.filter(
      (module: IModuleCoverage): boolean => within(r, module.file),
    );
    const loaded: number = under.filter(
      (module: IModuleCoverage): boolean => module.loaded,
    ).length;
    const functions: IModuleCoverage.ITarget[] = under.flatMap(
      (module: IModuleCoverage): IModuleCoverage.ITarget[] => module.functions,
    );
    const branches: IModuleCoverage.ITarget[] = under.flatMap(
      (module: IModuleCoverage): IModuleCoverage.ITarget[] => module.branches,
    );
    console.log(
      `\n${path.posix.relative(top, r)}: functions ${share(functions).trim()}, branches ${share(branches).trim()}, ${loaded} of ${under.length} modules loaded`,
    );
  }
}

/** A path with forward slashes. */
function normal(file: string): string {
  return file.replace(/\\/gu, "/");
}

main();
