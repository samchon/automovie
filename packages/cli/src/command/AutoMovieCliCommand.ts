import type { AutoMovieCommand } from "./AutoMovieCommand";
import { readCommandArguments } from "./internal/readCommandArguments";
import { run as runCli } from "./internal/run";

/** Parse and run the installed `automovie` command. */
export namespace AutoMovieCliCommand {
  /**
   * Parsed request, discriminated by `command`. Its scaffold fields and
   * remaining production tokens are defined by {@link AutoMovieCommand}.
   */
  export type Request = AutoMovieCommand;

  /**
   * Parse the tokens after the executable and script.
   *
   * An empty list requests help. `-h` and `--help` request help, and `-v` and
   * `--version` request the version. Each flag must be the only token.
   *
   * `create` admits one nonblank directory and accepts `--workspace`, `--force`
   * and `--name <name>` once each. `add` admits one `shorts/<directory>` or
   * `series/<directory>` target and accepts `--force` and `--name <name>` once
   * each. Options may appear before or after the target. A name token must be
   * nonblank and begin with a character other than a hyphen. The scaffold
   * validates the name during execution.
   *
   * `capture`, `inspect`, `render`, `review` and `check` return a fresh array
   * of the remaining tokens in order, including an empty array when no tokens
   * remain. Each operation validates those tokens during execution.
   *
   * @param args Command tokens without the executable and script.
   * @returns A request discriminated by its command.
   * @throws Error for an unknown command, extra tokens after a standalone flag,
   *   or a refused create or add request.
   */
  export function readArguments(args: readonly string[]): Request {
    return readCommandArguments(args);
  }

  /**
   * Run one CLI request using a full process argument vector.
   *
   * Help and version write to standard output. Create writes a production or
   * workspace at the resolved target. If its name is omitted, a target other
   * than the working directory gets a derived name. For the working directory
   * itself, an interactive terminal is asked and an unattended run uses
   * `automovie-examples`. Add requires `pnpm-workspace.yaml` in the working
   * directory, completes its missing catalog entries and writes the production
   * to `movies/<family>/<directory>`. A failed file write can leave a catalog
   * update and earlier files in place.
   *
   * Capture, inspect, render, review and check run from the current working
   * directory. Inspect serves its page until stopped. Review can record the
   * Inspector or save and reopen a file-bound review. Check reads observations.
   * Use `--run` to execute selected checks and `--require` to require the named
   * stage.
   *
   * The returned status is 0 for a successful dispatch and 1 for failed
   * captures, Inspector playback script errors, a blocked requested check stage
   * or a caught command failure. A caught failure goes to standard error as a
   * message and distinct cause messages. The executable uses the return value
   * as `process.exitCode`.
   *
   * @param argv Full process vector starting with the executable and script.
   * @returns The command's exit status.
   * @throws If formatting a failure or writing its report throws, the returned
   *   promise rejects.
   */
  export function run(argv: readonly string[]): Promise<number> {
    return runCli(argv);
  }
}
