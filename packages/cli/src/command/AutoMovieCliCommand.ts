import type { AutoMovieCommand } from "../AutoMovieCommand";
import { readAutoMovieCommandArguments } from "./internal/readAutoMovieCommandArguments";
import { run as runAutoMovieCli } from "./internal/run";

/** The executable command request and its argument reader. */
export namespace AutoMovieCliCommand {
  /** One admitted CLI request, discriminated by `command`. */
  export type Request = AutoMovieCommand;

  /**
   * Resolves the command-line tokens after the executable and script.
   *
   * @param args The command-line tokens after the executable and script.
   * @returns The admitted request.
   * @throws On an unknown command or any refusal of the delegated grammar.
   */
  export function readArguments(args: readonly string[]): Request {
    return readAutoMovieCommandArguments(args);
  }

  /**
   * The `automovie` CLI entry. `argv` is the full process vector; its first two
   * positions (executable and script) are skipped.
   *
   * - `help` and `version` write to stdout; the version is read from this package's
   *   `package.json`.
   * - `create` writes a single production, or with `--workspace` a workspace root,
   *   into the directory resolved against the working directory. The name is the
   *   typed `--name`, else derived from the target's basename; for the working
   *   directory itself the terminal is asked, offering `automovie-examples`,
   *   which is used without asking when no terminal is attached.
   * - `add` fills missing scaffold catalog entries in the working directory's
   *   `pnpm-workspace.yaml` and writes a production into
   *   `movies/<family>/<directory>`. Its name is `--name` or the npm-safe name
   *   derived from the directory segment.
   * - `capture` runs `AutoMovieCliCapture.capture` in the working directory as the
   *   production, resolving to its status: 1 when a cell was not drawn.
   * - `inspect` runs `AutoMovieCliInspect.inspect` in the working directory,
   *   serving the inspector page until the process is interrupted.
   * - `render` runs `AutoMovieCliRender.render` in the working directory as the
   *   production, resolving to 0 once the video is written.
   * - `review` runs `AutoMovieCliReview.review`, resolving to 1 when the recorded page
   *   reported a script error.
   *
   * `create` and `add` take their files from `AutoMovieTemplateScaffold.create`
   * and refuse a non-empty target without `--force`, which writes over same-path
   * files and keeps every other file. On success they list the written files
   * relative to the target, then the next steps. A failed write stops there and
   * leaves the files already written.
   *
   * Resolves to the process exit code, 0 after queuing the requested stdout text
   * or 1 after queuing a caught error's message and distinct `cause` objects'
   * messages without stacks. A repeated cause ends the chain. Reading or
   * stringifying an unusual thrown value, or writing stderr, can itself throw.
   * The executable assigns the result to `process.exitCode` so queued output can
   * drain.
   *
   * @param argv The full process vector.
   * @returns The exit code.
   */
  export function run(argv: readonly string[]): Promise<number> {
    return runAutoMovieCli(argv);
  }
}
