#!/usr/bin/env node
import {
  AUTO_MOVIE_AUTHORING_REACHABILITY,
  ScaffoldPublicationError,
  inspectAutoMovieAuthoringReachability,
  planAutoMovieDeliveryTocPublication,
  planAutoMovieProjectDeliveryTocs,
  publishFiles,
  renderScaffold,
  writeScaffoldFile,
} from "@automovie/template";
import * as fs from "node:fs";
import * as path from "node:path";

import { dispatchAutoMovieCommandArguments } from "./commandArguments";
import {
  assertAutoMovieMaintenanceObservation,
  observeAutoMovieMaintenanceFiles,
} from "./contractMaintenanceFileSystem";
import { inspectAutoMovieExternalProjectBytes } from "./externalInspection";
import {
  assertAutoMovieMaintenanceMarkdownInventory,
  readAutoMovieDeliveryMaintenanceMarkdownPaths,
} from "./readAutoMovieMaintenanceMarkdownPaths";
import { renderAutoMovieScaffoldNextSteps } from "./scaffoldNextSteps";

const USAGE = `automovie: scaffold an automovie project

Usage:
  npx create-automovie <directory> --language <chinese|english|japanese|korean> [--force]
  npx automovie start <directory> --language <chinese|english|japanese|korean> [--force]
  npx automovie toc [--check]
  npx automovie inspect-external <path> --profile <profile>
  npx automovie routes <film|brief|library>

Commands:
  start <directory>   Create <directory> and lay down the blank scaffold:
                      authoring documents, local skills, and source lint.
  toc                  Generate canonical script and screenplay index links.
  inspect-external     Inspect exact glTF, GLB, or VRM bytes for explicit
                       externalMotions adoption without semantic mapping.
  routes <kind>        Print the complete owner/input/consumer route
                       matrix for one production kind.

Options:
  --force             Scaffold into a non-empty directory (start only).
  --language <name>   Install exactly one production-authoring language pack.
  --check             Refuse a stale delivery table of contents (toc only).
  --profile <name>    Select gltf-static-v1, gltf-humanoid-v1,
                      gltf-motion-v1, or vrm-humanoid-v1.
  -h, --help          Show this help as a standalone request.
  -v, --version       Print the version as a standalone request.
`;

/**
 * This package's version, read at runtime from the sibling `package.json`
 * (`require`, not an `import`, so it stays outside `rootDir`). `__dirname`
 * resolves to `src` under ttsx and `lib` when published; the file sits one
 * level up in both.
 */
const packageVersion = (): string =>
  (require(path.join(__dirname, "..", "package.json")) as { version: string })
    .version;

/** Derive a valid npm package name from the target directory's basename. */
const projectNameOf = (targetDir: string): string =>
  path
    .basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "") || "automovie-project";

/**
 * The `automovie` CLI entry. `argv` is the full process vector; its first two
 * positions (executable and script) are skipped.
 *
 * - `help` and `version` write to stdout; the version is read from this
 *   package's `package.json`.
 * - `start` renders the scaffold for one language and publishes it into the
 *   directory resolved against the working directory, refusing a non-empty one
 *   without `--force`. Files written before a failed publication stay.
 * - `toc` takes the working directory as the project root and rewrites the
 *   delivery indexes under `docs/scripts`, `docs/screenplays` and
 *   `docs/final/screenplays`, replacing only files whose observed generation is
 *   unchanged; `--check` refuses a stale index without writing.
 * - `inspect-external` reads one regular, unlinked file inside the working
 *   directory, plus the sidecars it names, and prints the envelope as JSON.
 * - `routes` validates the shipped authoring route matrix and prints the rows
 *   for one production kind.
 *
 * Returns the process exit code, 0 on success or 1 after writing the error's
 * message (without its stack) to stderr, rather than exiting, so the logic
 * stays unit-testable and queued output drains before the process ends.
 *
 * @evidence contracts/common.md#principled-implementation Dispatches the admitted command union, resolves user paths with `path.resolve` against the working directory and tests containment with `path.relative` plus `path.isAbsolute`; `toc` runs observe, plan, re-enumerate, re-observe, then writes each file against its observed snapshot, so a concurrent edit is refused rather than overwritten. `inspect-external`'s containment test misses a bare `..` relative, which the regular-file check then refuses because `..` is a directory.
 * @evidence contracts/common.md#clear-and-simple-design Holds only command ordering and output: argument admission lives in `commandArguments`, physical observation in `contractMaintenanceFileSystem`, Markdown enumeration in `readAutoMovieMaintenanceMarkdownPaths`, and rendering, TOC planning and publication in `@automovie/template`; each command's effect sequence stays inline in one dispatcher closure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `routes` re-validates the shipped matrix and refuses rather than print an invalid one; the single catch turns every error, including an unexpected programming error, into its message on stderr and exit 1, which drops the stack.
 * @evidence contracts/common.md#meaningful-documentation States the skipped argv positions, each command's root, effects and refusals, the exit codes, and the stack-less error output.
 * @evidence contracts/performance.md#efficient-algorithms `start` is linear in rendered files; `toc` walks the delivery tree twice, reads every Markdown file twice, and finds each write's parent by a linear scan of observed directories (writes times directories); `inspect-external` reads each file whole once; `routes` validates the full matrix on every invocation before filtering one kind.
 * @evidence contracts/performance.md#reuse-equivalent-work `toc`'s second walk and observation are compared with the first rather than reused, because detecting change is their purpose, and the fresh observation's sources then feed publication planning; `inspect-external` shares one read per canonical sidecar path through `inspectAutoMovieExternalProjectBytes`; one process serves one command, so nothing is cached across invocations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Runs synchronously and holds no descriptor past a helper call (`readFileSync` and the template helpers close theirs); file bytes, sources and the JSON envelope live until the command returns, with no size cap on an inspected file; returning the code for `process.exitCode` instead of calling `process.exit` lets queued stdout and stderr writes drain.
 * @evidence contracts/portability.md#os-neutral-implementation Paths go through `node:path`: `inspect-external` turns its native relative path into `/` spelling and splits each canonical sidecar path back into segments for `path.resolve`, a Windows cross-drive target surfaces as an absolute relative, and publication uses the template's `openat` or `NtCreateFile` adapter selected by `process.platform`. `toc` inherits the observation root test, which refuses a working directory spelled through a Windows 8.3 short name or a `subst` drive because its native real path differs from that spelling.
 * @author Samchon
 */
export const run = (argv: readonly string[]): number => {
  try {
    return dispatchAutoMovieCommandArguments(argv.slice(2), (command) => {
      if (command.command === "help") {
        process.stdout.write(USAGE);
        return 0;
      }
      if (command.command === "version") {
        process.stdout.write(`${packageVersion()}\n`);
        return 0;
      }
      if (command.command === "inspect-external") {
        const root = fs.realpathSync(process.cwd());
        const source = path.resolve(root, command.path);
        const relative = path.relative(root, source);
        if (
          relative === "" ||
          relative.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relative)
        )
          throw new Error(
            "inspect-external source must be a file inside the current project.",
          );
        const sourceBytes = readProjectRegularFile(root, source);
        if (sourceBytes === null)
          throw new Error(
            "inspect-external source must be one regular, non-linked file inside the current project.",
          );
        const inspection = inspectAutoMovieExternalProjectBytes({
          bytes: sourceBytes,
          source: relative.split(path.sep).join("/"),
          profile: command.profile,
          readResource: (resource) =>
            readProjectRegularFile(
              root,
              path.resolve(root, ...resource.split("/")),
            ),
        });
        process.stdout.write(`${JSON.stringify(inspection, null, 2)}\n`);
        return 0;
      }

      if (command.command === "routes") {
        const findings = inspectAutoMovieAuthoringReachability(
          AUTO_MOVIE_AUTHORING_REACHABILITY,
        );
        if (findings.length !== 0)
          throw new Error(
            `Authoring route matrix is invalid:\n${findings.join("\n")}`,
          );
        process.stdout.write(
          `${JSON.stringify(
            AUTO_MOVIE_AUTHORING_REACHABILITY.filter(
              (row) => row.kind === command.kind,
            ),
            null,
            2,
          )}\n`,
        );
        return 0;
      }

      if (command.command === "toc") {
        const root = process.cwd();
        const physical = observeAutoMovieMaintenanceFiles({
          root,
          paths: [],
        }).root;
        const paths = readAutoMovieDeliveryMaintenanceMarkdownPaths(physical);
        const observation = observeAutoMovieMaintenanceFiles({
          root: physical,
          paths,
        });
        const plan = planAutoMovieProjectDeliveryTocs({
          check: command.check,
          files: observation.sources,
        });
        if (plan.diagnostics.length !== 0)
          throw new Error(plan.diagnostics.join("\n"));
        assertAutoMovieMaintenanceMarkdownInventory(
          paths,
          readAutoMovieDeliveryMaintenanceMarkdownPaths(physical),
        );
        const current = assertAutoMovieMaintenanceObservation(observation);
        const writes = planAutoMovieDeliveryTocPublication({
          current: observation.sources,
          observed: current.sources,
          planned: plan.files,
        });
        if (!command.check)
          for (const [relative, source] of Object.entries(writes)) {
            const target = path.resolve(root, relative);
            const parent = observation.directories.find(
              (directory) => directory.path === path.dirname(target),
            );
            if (parent === undefined)
              throw new Error("Delivery index lost its observed parent.");
            const outcome = writeScaffoldFile({
              base: observation.root,
              parent,
              target,
              expected: observation.files[relative],
              bytes: Buffer.from(source, "utf8"),
              force: true,
            });
            if (outcome.status !== "completed")
              throw new Error("Delivery index publication did not complete.", {
                cause: outcome,
              });
          }
        process.stdout.write(
          `${command.check ? "Checked" : "Updated"} delivery table of contents.\n`,
        );
        return 0;
      }

      const targetDir = path.resolve(process.cwd(), command.directory);
      const files = renderScaffold({
        name: projectNameOf(targetDir),
        language: command.language,
      });
      const receipt = publishFiles(targetDir, files, { force: command.force });
      if (receipt.status !== "completed")
        throw new ScaffoldPublicationError(receipt);
      const written = receipt.completed.map(({ entry }) => entry.target);
      process.stdout.write(
        `Scaffolded ${written.length} files into ${targetDir}\n\n` +
          written
            .map((file) => `  ${path.relative(targetDir, file) || "."}`)
            .join("\n") +
          renderAutoMovieScaffoldNextSteps(targetDir),
      );
      return 0;
    });
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
};

const readProjectRegularFile = (
  root: string,
  target: string,
): Uint8Array | null => {
  const relative = path.relative(root, target);
  if (
    relative === "" ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    return null;
  try {
    const status = fs.lstatSync(target);
    if (status.isFile() === false || status.isSymbolicLink()) return null;
    if (path.relative(target, fs.realpathSync(target)) !== "") return null;
    return fs.readFileSync(target);
  } catch {
    return null;
  }
};

if (require.main === module) process.exitCode = run(process.argv);
