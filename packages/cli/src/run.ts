import {
  type IScaffoldCompletedPublication,
  type IScaffoldPublicationReceipt,
  ScaffoldPublicationError,
  publishFiles,
  renderScaffold,
  renderWorkspaceProductionScaffold,
  renderWorkspaceScaffold,
  syncScaffold,
} from "@automovie/template";
import * as fs from "node:fs";
import * as path from "node:path";

import type { AutoMovieCommand } from "./AutoMovieCommand";
import { captureAutoMovie } from "./captureAutoMovie";
import { inspectAutoMovie } from "./inspectAutoMovie";
import type { IAutoMoviePackageManager } from "./IAutoMoviePackageManager";
import { deriveAutoMovieProjectName } from "./deriveAutoMovieProjectName";
import { promptAutoMovieProjectName } from "./promptAutoMovieProjectName";
import { readAutoMovieCommandArguments } from "./readAutoMovieCommandArguments";
import { renderAutoMovieScaffoldNextSteps } from "./renderAutoMovieScaffoldNextSteps";
import { selectAutoMoviePackageManager } from "./selectAutoMoviePackageManager";
import { selectAutoMovieProjectName } from "./selectAutoMovieProjectName";

const USAGE: string = `automovie: scaffold an automovie project and capture its stills

Usage:
  npx automovie create <directory> [--workspace] [--name <name>] [--force]
  pnpm automovie add <shorts|series>/<name> [--name <name>] [--force]
  npx automovie sync <directory> [--check] [--baseline <directory>]
  automovie capture --module <file> [--backend software|gpu] [--out <dir>] [<request>]
  automovie capture --file <video> [--out <dir>] [<request>]
  automovie inspect --module <file> [--props <json>] [--port <n>] [<request>]

Commands:
  create          A single production, or with --workspace a pnpm workspace
                  root for movies/shorts, movies/series and packages.
  add             From a workspace root, a production at movies/<family>/<name>:
                  shorts run brief -> screenplay, series the long route.
  sync            Update the generated instructions of a single production
                  or a workspace root.
  capture         In a production, draw the subjects a module offers in headless
                  Chromium, or take a video file's own frames, into stills,
                  contact sheets and record.json. Needs @automovie/render, vite
                  and playwright-core in the production, and FFmpeg for --file.
  inspect         In a production or package, serve the inspector page over the
                  subjects a module offers and print its address, whose query
                  is the request. Needs @automovie/render, @automovie/viewer,
                  react, react-dom and vite there; Ctrl+C stops it.

Options:
  --workspace     Create a pnpm workspace root instead of a single production.
  --name          Package name; create asks for one when the target is the
                  current directory, and add defaults to the directory name.
  --force         Install into a non-empty directory, replacing same-path files.
  --check         Report a sync plan; exit 1 when updates or conflicts remain.
  --baseline      Previous adopted instructions the files came from; they
                  override the stored sync state for the files they hold.
  --module        capture, inspect: the module whose subjects(props) the page
                  draws.
  --port          inspect: the port to serve on; default a free port.
  --props         inspect: a JSON file the module's subjects(props) is called
                  with; default null.
  --file          capture: an encoded video file instead of a subject.
  --backend       capture: software (SwiftShader, the default) or gpu.
  --out           capture: the folder; default media/capture/<subject>.
  <request>       capture, inspect: --subject, --at, --from, --to, --rate, --events,
                  --views, --passes, --marks, --label, --round, --compare and
                  every other key of the capture request grammar.
  -h, --help      Show this help as a standalone request.
  -v, --version   Print the version as a standalone request.
`;

/**
 * The `automovie` CLI entry. `argv` is the full process vector; its first two positions (executable and script) are skipped.
 *
 * - `help` and `version` write to stdout; the version is read from this package's `package.json`.
 * - `create` renders a single production, or with `--workspace` a workspace root, and publishes it into the directory resolved against the working directory. The name is the typed `--name`, else derived from the target's basename; for the working directory itself the terminal is asked, offering `automovie-examples`, which is used without asking when no terminal is attached.
 * - `add` requires `pnpm-workspace.yaml` in the working directory, which it takes as the workspace root without searching elsewhere, and publishes a workspace production into `movies/<family>/<directory>`, named by `--name`, else by the npm-safe name derived from the directory segment as `create` derives one.
 * - `sync` plans explicit generated-instruction updates for the directory holding `AGENTS.md`, preserves project contracts and content and refuses local conflicts; check reports pending updates without writing.
 * - `capture` runs `captureAutoMovie` in the working directory as the production, resolving to its status: 1 when a cell was not drawn.
 * - `inspect` runs `inspectAutoMovie` in the working directory, serving the inspector page until the process is interrupted.
 *
 * `create` and `add` refuse a non-empty target without `--force`. On success they list the written files relative to the target, then the next steps. Completed and partial file effects stay after failure; the error names the completed files and the stopping entry. Prepared directories can remain even when no file was written.
 *
 * Resolves to the process exit code, 0 after queuing the requested stdout text or 1 after queuing a caught error's message and distinct `cause` objects' messages without stacks. A repeated cause ends the chain. Reading or stringifying an unusual thrown value, or writing stderr, can itself throw. The executable assigns the result to `process.exitCode` so queued output can drain.
 *
 * @param argv The full process vector.
 * @returns The exit code.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Parsing finishes before rendering or publication, and path.resolve binds every target to the current working directory. A non-completed receipt becomes ScaffoldPublicationError, preserving the completed prefix and stopping outcome; describeError follows distinct cause values with a set to terminate cycles, but assumes their message access and string conversion do not throw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This dispatcher delegates admission, name choice, the prompt and closing text to CLI owners and rendering and publication to the template package. Only bin.ts invokes it at module load, so importing run does not execute a request.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `add` checks only the working directory for `pnpm-workspace.yaml` and never searches ancestors; only `create`'s next steps detect a package manager. The catch reports failures without stacks and never retries publication or rolls back files.
 * @evidence contracts/development/common.md#meaningful-documentation The comment gives argv ownership, every command's effect, name and target choice, retained file and directory effects, and the returned status.
 * @evidence contracts/development/implementation.md#efficient-algorithms For n files, rendering reads total bytes and sorts directory entries and the n rendered paths for deterministic order and collision reporting. Publication encodes those bytes and checks each path's ancestors before writing; listing scans completed paths once. Sync adds linear instruction reads and digests and the existing conditional publication path. Failure formatting additionally walks the distinct cause chain.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every command takes fresh filesystem observations and cannot reuse an earlier receipt. Check observes without publishing. Rendering reads the installed scaffold anew; only the template's per-call directory captures are reused and revalidated during that publication.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rendered strings, encoded candidate bytes, receipt entries, and listing text scale with scaffold size; the cause set scales with chain length without a fixed cap. The prompt closes its terminal interface before returning. This dispatcher owns no descriptor; queued stdout and stderr bytes belong to the process streams.
 */
export async function run(argv: readonly string[]): Promise<number> {
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
    if (command.command === "capture")
      return await captureAutoMovie({
        args: command.args,
        root: process.cwd(),
        env: process.env,
      });
    if (command.command === "inspect")
      return await inspectAutoMovie({ args: command.args, root: process.cwd() });
    if (command.command === "sync") {
      const targetDir: string = path.resolve(process.cwd(), command.directory);
      const result: ReturnType<typeof syncScaffold> = syncScaffold({
        location: targetDir,
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
    if (command.command === "add") {
      const root: string = process.cwd();
      if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml")))
        throw new Error(
          `add runs at an AutoMovie workspace root, and ${root} has no pnpm-workspace.yaml; create one with automovie create <directory> --workspace.`,
        );
      const targetDir: string = path.join(
        root,
        "movies",
        command.family,
        command.directory,
      );
      publish(
        targetDir,
        renderWorkspaceProductionScaffold({
          name: command.name ?? deriveAutoMovieProjectName(command.directory),
        }),
        command.force,
        "workspace-production",
      );
      return 0;
    }

    // Create: a typed or derived name, else the terminal's answer for the working directory itself.
    const targetDir: string = path.resolve(process.cwd(), command.directory);
    const name: string =
      selectAutoMovieProjectName({
        directory: command.directory,
        cwd: process.cwd(),
        ...(command.name === undefined ? {} : { name: command.name }),
      }) ?? (await promptAutoMovieProjectName());
    publish(
      targetDir,
      command.workspace
        ? renderWorkspaceScaffold({ name })
        : renderScaffold({ name }),
      command.force,
      command.workspace ? "workspace" : "production",
      selectAutoMoviePackageManager({
        directory: targetDir,
        ...(process.env.npm_config_user_agent === undefined
          ? {}
          : { userAgent: process.env.npm_config_user_agent }),
      }),
    );
    return 0;
  } catch (error) {
    process.stderr.write(describeError(error));
    return 1;
  }
}

/**
 * Publish one rendered installation, then list the written files and the next steps; a refused or partial receipt throws with its completed prefix.
 */
function publish(
  targetDir: string,
  files: Record<string, string>,
  force: boolean,
  kind: "production" | "workspace" | "workspace-production",
  packageManager?: IAutoMoviePackageManager,
): void {
  const receipt: IScaffoldPublicationReceipt = publishFiles(targetDir, files, {
    force,
  });
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
      renderAutoMovieScaffoldNextSteps(targetDir, kind, packageManager),
  );
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
