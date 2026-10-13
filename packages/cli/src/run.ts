import {
  type IScaffoldCompletedPublication,
  type IScaffoldPublicationReceipt,
  ScaffoldPublicationError,
  publishFiles,
  renderScaffold,
} from "@automovie/template";
import * as path from "node:path";

import type { AutoMovieCommand } from "./AutoMovieCommand";
import { readAutoMovieCommandArguments } from "./readAutoMovieCommandArguments";
import { deriveAutoMovieProjectName } from "./deriveAutoMovieProjectName";
import { renderAutoMovieScaffoldNextSteps } from "./renderAutoMovieScaffoldNextSteps";

const USAGE: string = `automovie: scaffold an automovie project

Usage:
  npx automovie start <directory> [--force]

Options:
  --force         Scaffold into a non-empty directory.
  -h, --help      Show this help as a standalone request.
  -v, --version   Print the version as a standalone request.
`;

/**
 * The `automovie` CLI entry. `argv` is the full process vector; its first two
 * positions (executable and script) are skipped.
 *
 * - `help` and `version` write to stdout; the version is read from this
 *   package's `package.json`.
 * - `start` renders the scaffold, naming the project with
 *   `deriveAutoMovieProjectName`, and publishes it into the directory resolved
 *   against the working directory, refusing a non-empty one without `--force`.
 *   On success it lists the written files relative to the target, then the
 *   next steps. Files written before a failed publication stay, and the error
 *   names them.
 *
 * Returns the process exit code, 0 on success or 1 after writing the error's
 * message and each of its `cause` messages (without stacks) to stderr, rather
 * than exiting, so queued output drains before the process ends.
 *
 * @evidence contracts/common.md#principled-implementation The request is fully parsed before any effect, the target is resolved once with `path.resolve` against `process.cwd()`, and the npm project name comes from `deriveAutoMovieProjectName`; a refused publication is reported through the standard `Error.cause` chain, which carries the template's own reason such as the non-empty-target refusal.
 * @evidence contracts/common.md#clear-and-simple-design `run` owns only dispatch and console output: argument admission is `readAutoMovieCommandArguments`, the project name is `deriveAutoMovieProjectName`, the closing text is `renderAutoMovieScaffoldNextSteps`, and rendering and publication are `@automovie/template`'s; the executable guard lives in `bin.ts` so importing this module never starts the CLI.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No directory, fixture, or test is special-cased; the single catch converts every error, including an unexpected programming error, to its message chain and exit 1, which deliberately drops stacks for a user-facing CLI.
 * @evidence contracts/common.md#meaningful-documentation The comment states which argv positions are skipped, each command's output and effects, how the project name and target are derived, that partial files stay, and the exit codes with the stack-free stderr format.
 * @evidence contracts/performance.md#efficient-algorithms `start` is linear in the scaffold's file count and bytes: one render, one publication pass, and one map over the completed receipt for the listing; `help` and `version` do constant work beyond reading one `package.json`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call serves one process invocation with one effectful publication, and publication must not be shared or replayed between calls, so nothing is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources `run` retains the rendered map and receipt for the call, bounded by scaffold size; the template attempts per-file descriptor release on every outcome and reports close failures without proving those handles were released. This dispatcher acquires no handle or asynchronous task itself.
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
 * This package's version, read at runtime from the sibling `package.json`
 * (`require`, not an `import`, so it stays outside `rootDir`). `__dirname`
 * resolves to `src` under ttsx and `lib` when published; the file sits one
 * level up in both.
 */
function packageVersion(): string {
  const manifest: { version: string } = require(
    path.join(__dirname, "..", "package.json"),
  ) as { version: string };
  return manifest.version;
}

/**
 * One stderr block: the error's message, then each distinct `cause` message on
 * its own `caused by:` line. A value that is not an `Error` is stringified.
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
