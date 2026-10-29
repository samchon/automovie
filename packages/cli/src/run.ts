import {
  type IScaffoldCompletedPublication,
  type IScaffoldPublicationReceipt,
  ScaffoldPublicationError,
  publishFiles,
  renderScaffold,
  syncScaffold,
} from "@automovie/template";
import * as path from "node:path";

import type { AutoMovieCommand } from "./AutoMovieCommand";
import { deriveAutoMovieProjectName } from "./deriveAutoMovieProjectName";
import { readAutoMovieCommandArguments } from "./readAutoMovieCommandArguments";
import { renderAutoMovieScaffoldNextSteps } from "./renderAutoMovieScaffoldNextSteps";

const USAGE: string = `automovie: scaffold an automovie project

Usage:
  npx automovie start <directory> [--force]
  npx automovie sync <directory> [--check] [--baseline <directory>]

Options:
  --force         Scaffold into a non-empty directory.
  --check         Report a sync plan; exit 1 when updates or conflicts remain.
  --baseline      Previous adopted instructions for a legacy sync.
  -h, --help      Show this help as a standalone request.
  -v, --version   Print the version as a standalone request.
`;

/**
 * The `automovie` CLI entry. `argv` is the full process vector; its first two positions (executable and script) are skipped.
 *
 * - `help` and `version` write to stdout; the version is read from this package's `package.json`.
 * - `sync` plans explicit generated-instruction updates, preserves project contracts/content and refuses local conflicts; check reports pending updates without writing.
 * - `start` renders the scaffold, naming the project with `deriveAutoMovieProjectName`, and publishes it into the directory resolved against the working directory, refusing a non-empty one without `--force`. On success it lists the written files relative to the target, then the next steps. Completed and partial file effects stay after failure; the error names the completed files and the stopping entry. Prepared directories can remain even when no file was written.
 *
 * Returns the process exit code, 0 after queuing the requested stdout text or 1 after queuing a caught error's message and distinct `cause` objects' messages without stacks. A repeated cause ends the chain. Reading or stringifying an unusual thrown value, or writing stderr, can itself throw; asynchronous stream failures are outside this synchronous catch. The executable assigns the result to `process.exitCode` so queued output can drain.
 *
 * @evidence contracts/common.md#principled-implementation Parsing finishes before rendering or publication, and path.resolve binds the supplied directory to the current working directory. A non-completed receipt becomes ScaffoldPublicationError, preserving the completed prefix and stopping outcome; describeError follows distinct cause values with a set to terminate cycles, but assumes their message access and string conversion do not throw.
 * @evidence contracts/common.md#clear-and-simple-design This dispatcher delegates admission, name normalization, and closing text to CLI owners and rendering and publication to the template package. Only bin.ts invokes it at module load, so importing run does not execute a request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catch deliberately reports synchronous failures without stacks and never retries publication or rolls back files. It does not special-case callers or fixtures; failure while formatting the caught value or writing stderr can still escape instead of returning exit 1.
 * @evidence contracts/common.md#meaningful-documentation The comment gives argv ownership, command effects, name and target derivation, retained file and directory effects, and the distinction between queued output, the returned status, and failures outside the synchronous catch.
 * @evidence contracts/performance.md#efficient-algorithms For n files, rendering reads total bytes and sorts directory entries and the n rendered paths for deterministic order and collision reporting. Publication encodes those bytes and checks each path's ancestors before writing; listing scans completed paths once. Thus bytes, path lengths and depths, and n log n path comparisons drive start, rather than file count alone. Sync adds linear instruction reads and digests and the existing conditional publication path. Failure formatting additionally walks the distinct cause chain.
 * @evidence contracts/performance.md#reuse-equivalent-work Start and sync take fresh filesystem observations and cannot reuse an earlier receipt. Check observes without publishing. Rendering reads the installed scaffold anew; only the template's per-call directory captures are reused and revalidated during that publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rendered strings, encoded candidate bytes, receipt entries, and listing text scale with scaffold size; the cause set scales with chain length without a fixed cap. Template adapters attempt release on each outcome and report close failures without proving release. This dispatcher owns no descriptor or asynchronous task; queued stdout and stderr bytes belong to the process streams.
 */
export function run(argv: readonly string[]): number {
  try {
    const command: AutoMovieCommand = readAutoMovieCommandArguments(
      argv.slice(2),
    );
    if (command.command === "help") {
      process.stdout.write(USAGE);
      return 0;
    }
    if (command.command === "version") {
      process.stdout.write(`${packageVersion()}\n`);
      return 0;
    }
    const targetDir: string = path.resolve(process.cwd(), command.directory);
    if (command.command === "sync") {
      const result: ReturnType<typeof syncScaffold> = syncScaffold({
        location: targetDir,
        name: deriveAutoMovieProjectName(targetDir),
        check: command.check,
        baseline: command.baseline,
      });
      process.stdout.write(
        `Scaffold sync ${result.status}: ${targetDir}\n` +
          [
            ...Object.keys(result.plan.files).map(
              (file: string): string => `  update ${file}`,
            ),
            ...result.plan.conflicts.map(
              (file: string): string => `  conflict ${file}`,
            ),
            ...result.plan.retired.map(
              (file: string): string =>
                `  retained retired instruction ${file}`,
            ),
          ].join("\n") +
          "\n",
      );
      if (result.receipt !== undefined && result.receipt.status !== "completed")
        throw new ScaffoldPublicationError(result.receipt);
      return result.status === "conflicted" ||
        (command.check && Object.keys(result.plan.files).length > 0)
        ? 1
        : 0;
    }
    const receipt: IScaffoldPublicationReceipt = publishFiles(
      targetDir,
      renderScaffold({ name: deriveAutoMovieProjectName(targetDir) }),
      { force: command.force },
    );
    if (receipt.status !== "completed")
      throw new ScaffoldPublicationError(receipt);
    process.stdout.write(
      `Scaffolded ${receipt.completed.length} files into ${targetDir}\n\n` +
        receipt.completed
          .map(
            ({ entry }: IScaffoldCompletedPublication): string =>
              `  ${entry.relative}`,
          )
          .join("\n") +
        renderAutoMovieScaffoldNextSteps(targetDir),
    );
    return 0;
  } catch (error) {
    process.stderr.write(describeError(error));
    return 1;
  }
}

/**
 * This package's version, read at runtime from the sibling `package.json` (`require`, not an `import`, so it stays outside `rootDir`). `__dirname` resolves to `src` under ttsx and `lib` when published; the file sits one level up in both.
 */
function packageVersion(): string {
  const manifest: { version: string } = require(
    path.join(__dirname, "..", "package.json"),
  ) as { version: string };
  return manifest.version;
}

/**
 * One stderr block: the error's message, then each distinct cause value's message on its own `caused by:` line. Values outside `Error` are stringified and end the chain. Repeated object identity or primitive value stops traversal; getters and string conversion can throw.
 */
function describeError(error: unknown): string {
  const lines: string[] = [];
  const seen: Set<unknown> = new Set();
  let current: unknown = error;
  while (current !== undefined && seen.has(current) === false) {
    seen.add(current);
    const message: string =
      current instanceof Error ? current.message : String(current);
    lines.push(lines.length === 0 ? message : `  caused by: ${message}`);
    current = current instanceof Error ? current.cause : undefined;
  }
  return `${lines.join("\n")}\n`;
}
