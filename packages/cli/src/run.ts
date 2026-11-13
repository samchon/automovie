import {
  type IAutoMovieScaffoldProps,
  createAutoMovieScaffold,
} from "@automovie/template";
import * as fs from "node:fs";
import * as path from "node:path";

import type { AutoMovieCommand } from "./AutoMovieCommand";
import { captureAutoMovie } from "./captureAutoMovie";
import { deriveAutoMovieProjectName } from "./deriveAutoMovieProjectName";
import { inspectAutoMovie } from "./inspectAutoMovie";
import { promptAutoMovieProjectName } from "./promptAutoMovieProjectName";
import { readAutoMovieCommandArguments } from "./readAutoMovieCommandArguments";
import { renderAutoMovie } from "./renderAutoMovie";
import { renderAutoMovieScaffoldNextSteps } from "./renderAutoMovieScaffoldNextSteps";
import { reviewAutoMovie } from "./reviewAutoMovie";
import { selectAutoMovieProjectName } from "./selectAutoMovieProjectName";

const USAGE: string = `automovie: scaffold an automovie project, and capture, render and review it

Usage:
  npx automovie create <directory> [--workspace] [--name <name>] [--force]
  pnpm automovie add <shorts|series>/<name> [--name <name>] [--force]
  automovie capture --module <file> [--props <json>] [--backend software|gpu] [--out <dir>] [<request>]
  automovie capture --file <video> [--out <dir>] [<request>]
  automovie inspect --module <file> [--props <json>] [--port <n>] [<request>]
  automovie render --module <file> [--subject <name>] [--props <json>] [--out <dir>] [--backend software|gpu]
  automovie review --url <inspector address> --seconds <s> [--out <dir>]

Commands:
  create          A single production, or with --workspace a pnpm workspace
                  root for movies/shorts, movies/series and packages.
  add             From a workspace root, a production at movies/<family>/<name>:
                  shorts run brief -> screenplay, series the long route.
  capture         In a production, draw the subjects a module offers in headless
                  Chromium, or take a video file's own frames, into stills,
                  contact sheets and record.json. Needs @automovie/render, vite
                  and playwright-core in the production, and FFmpeg for --file.
  inspect         In a production or package, serve the inspector page over the
                  subjects a module offers and print its address, whose query
                  is the request. Needs @automovie/render, @automovie/viewer,
                  react, react-dom and vite there; Ctrl+C stops it.
  render          In a production, draw every frame of one subject through the
                  draw page in headless Chromium and encode film.mp4 with
                  render-report.json. Needs what capture needs, and FFmpeg.
  review          Record real-time playback of the running inspector page as a
                  video with playback.json. Needs playwright-core and
                  Playwright's ffmpeg (npx playwright-core install ffmpeg).

Options:
  --workspace     Create a pnpm workspace root instead of a single production.
  --name          Package name; create asks for one when the target is the
                  current directory, and add defaults to the directory name.
  --force         Install into a non-empty directory, replacing same-path files.
  --module        capture, inspect, render: the module whose subjects(props)
                  the page draws.
  --port          inspect: the port to serve on; default a free port.
  --props         capture, inspect, render: a JSON file the module's subjects(props) is
                  called with; default null.
  --file          capture: an encoded video file instead of a subject.
  --backend       capture, render: software (SwiftShader, the default) or gpu.
  --out           capture: the folder; default media/capture/<subject>.
                  render: default media/automovie/<subject>/videos.
                  review: default media/automovie/review.
  --url           review: the running inspector page's address.
  --seconds       review: wall-clock seconds of playback recorded.
  <request>       capture, inspect: --subject, --at, --from, --to, --rate, --events,
                  --views, --passes, --marks, --label, --round, --compare and
                  every other key of the capture request grammar; render takes
                  --subject alone, the subject rendered, default the only one.
  -h, --help      Show this help as a standalone request.
  -v, --version   Print the version as a standalone request.
`;

/**
 * The `automovie` CLI entry. `argv` is the full process vector; its first two positions (executable and script) are skipped.
 *
 * - `help` and `version` write to stdout; the version is read from this package's `package.json`.
 * - `create` writes a single production, or with `--workspace` a workspace root, into the directory resolved against the working directory. The name is the typed `--name`, else derived from the target's basename; for the working directory itself the terminal is asked, offering `automovie-examples`, which is used without asking when no terminal is attached.
 * - `add` requires `pnpm-workspace.yaml` in the working directory, which it takes as the workspace root without searching elsewhere, and writes a workspace production into `movies/<family>/<directory>`, named by `--name`, else by the npm-safe name derived from the directory segment as `create` derives one.
 * - `capture` runs `captureAutoMovie` in the working directory as the production, resolving to its status: 1 when a cell was not drawn.
 * - `inspect` runs `inspectAutoMovie` in the working directory, serving the inspector page until the process is interrupted.
 * - `render` runs `renderAutoMovie` in the working directory as the production, resolving to 0 once the video is written.
 * - `review` runs `reviewAutoMovie`, resolving to 1 when the recorded page reported a script error.
 *
 * `create` and `add` take their files from `createAutoMovieScaffold` and refuse a non-empty target without `--force`, which writes over same-path files and keeps every other file. On success they list the written files relative to the target, then the next steps. A failed write stops there and leaves the files already written.
 *
 * Resolves to the process exit code, 0 after queuing the requested stdout text or 1 after queuing a caught error's message and distinct `cause` objects' messages without stacks. A repeated cause ends the chain. Reading or stringifying an unusual thrown value, or writing stderr, can itself throw. The executable assigns the result to `process.exitCode` so queued output can drain.
 *
 * @param argv The full process vector.
 * @returns The exit code.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Parsing finishes before the scaffold is created, the whole file map exists before the first write, and path.resolve binds every target to the current working directory. describeError follows distinct cause values with a set to terminate cycles, but assumes their message access and string conversion do not throw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This dispatcher delegates admission, name choice, the prompt and closing text to CLI owners and the file map to the template package, keeping only the write. Only bin.ts invokes it at module load, so importing run does not execute a request.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `add` checks only the working directory for `pnpm-workspace.yaml` and never searches ancestors. The catch reports failures without stacks and never retries a write or rolls back files.
 * @evidence contracts/development/common.md#meaningful-documentation The comment gives argv ownership, every command's effect, name and target choice, retained file effects, and the returned status.
 * @evidence contracts/development/implementation.md#efficient-algorithms For n files, creation reads the scaffold once and each file is written once with its directory ensured; listing scans the written paths once. Failure formatting additionally walks the distinct cause chain.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Every command takes fresh filesystem observations and reads the installed scaffold anew.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The file map and listing text scale with scaffold size; the cause set scales with chain length without a fixed cap. The prompt closes its terminal interface before returning. This dispatcher owns no descriptor; queued stdout and stderr bytes belong to the process streams.
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
      return await inspectAutoMovie({
        args: command.args,
        root: process.cwd(),
      });
    if (command.command === "render")
      return await renderAutoMovie({
        args: command.args,
        root: process.cwd(),
        env: process.env,
      });
    if (command.command === "review")
      return await reviewAutoMovie({
        args: command.args,
        root: process.cwd(),
        env: process.env,
      });
    if (command.command === "add") {
      const root: string = process.cwd();
      if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml")))
        throw new Error(
          `add runs at an AutoMovie workspace root, and ${root} has no pnpm-workspace.yaml; create one with automovie create <directory> --workspace.`,
        );
      write(
        path.join(root, "movies", command.family, command.directory),
        {
          kind: "workspace-production",
          name: command.name ?? deriveAutoMovieProjectName(command.directory),
        },
        command.force,
      );
      return 0;
    }

    // Create: a typed or derived name, else the terminal's answer for the working directory itself.
    write(
      path.resolve(process.cwd(), command.directory),
      {
        kind: command.workspace ? "workspace" : "production",
        name:
          selectAutoMovieProjectName({
            directory: command.directory,
            cwd: process.cwd(),
            ...(command.name === undefined ? {} : { name: command.name }),
          }) ?? (await promptAutoMovieProjectName()),
      },
      command.force,
    );
    return 0;
  } catch (error) {
    process.stderr.write(describeError(error));
    return 1;
  }
}

/**
 * Write one created installation into `directory`, then list the written files and the next steps. A non-empty directory is refused unless `force` is set, which writes over same-path files and keeps every other file.
 */
function write(
  directory: string,
  props: IAutoMovieScaffoldProps,
  force: boolean,
): void {
  const files: Record<string, string> = createAutoMovieScaffold(props);
  if (
    force === false &&
    fs.existsSync(directory) &&
    fs.readdirSync(directory).length !== 0
  )
    throw new Error(
      `${directory} is not empty; pass --force to write into it, replacing same-path files.`,
    );
  for (const [relative, content] of Object.entries(files)) {
    const file: string = path.join(directory, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
  }
  process.stdout.write(
    `Scaffolded ${Object.keys(files).length} files into ${directory}\n\n` +
      Object.keys(files)
        .map((relative: string): string => `  ${relative}`)
        .join("\n") +
      renderAutoMovieScaffoldNextSteps(directory, props.kind),
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
