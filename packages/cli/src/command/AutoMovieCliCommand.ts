import type { AutoMovieCommand } from "../AutoMovieCommand";
import { readAutoMovieCommandArguments } from "./internal/readAutoMovieCommandArguments";

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
}
