import { type AutoMovieCommand } from "./AutoMovieCommand";
import { readAutoMovieAddArguments } from "./readAutoMovieAddArguments";
import { readAutoMovieCreateArguments } from "./readAutoMovieCreateArguments";
import { readAutoMovieSyncArguments } from "./readAutoMovieSyncArguments";

/**
 * Resolve one complete CLI request before any scaffold publication begins.
 *
 * `args` excludes the node executable and script positions. No arguments, or a lone `-h`/`--help`, means help; a lone `-v`/`--version` means version. `create`, `add` and `sync` delegate their grammars to {@link readAutoMovieCreateArguments}, {@link readAutoMovieAddArguments} and {@link readAutoMovieSyncArguments}; `capture` keeps its tokens for the production's request reader, which `run` loads. Every refusal throws an `Error` whose message names the correction.
 *
 * @param args The command-line tokens after the executable and script.
 * @returns The admitted request.
 * @throws On an unknown command or any refusal of the delegated grammar.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Standalone flags are decided before any command because they admit no other token, and each command's grammar validates the whole request before returning, so `run` never begins publication on a partially understood command line.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This function only dispatches on the first token; each command owns its own grammar file, avoiding an argument-parsing dependency.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The command spellings are the documented CLI contract; every other first token is refused with a message rather than ignored, and no fallback admits a removed command such as `start`.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states which argv positions `args` excludes, what the standalone flags mean, which owner parses each command, and that every refusal names the correction.
 * @evidence contracts/development/implementation.md#efficient-algorithms One destructuring copy and one comparison chain before the delegated linear scan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure parser handles one supplied vector per call and coordinates no requests or effectful work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The parser opens no handle or task and retains no array after return; returned requests keep only their admitted strings and flags.
 */
export function readAutoMovieCommandArguments(
  args: readonly string[],
): AutoMovieCommand {
  if (args.length === 0) return { command: "help" };
  const [command, ...rest]: readonly string[] = args;
  if (command === "-h" || command === "--help")
    return standalone(command, rest, { command: "help" });
  if (command === "-v" || command === "--version")
    return standalone(command, rest, { command: "version" });
  if (command === "create") return readAutoMovieCreateArguments(rest);
  if (command === "add") return readAutoMovieAddArguments(rest);
  if (command === "sync") return readAutoMovieSyncArguments(rest);
  if (command === "capture") return { command: "capture", args: [...rest] };
  throw new Error(
    `Unknown command ${JSON.stringify(command)}; the commands are create, add, sync and capture (see --help).`,
  );
}

/** Admit a standalone flag only when no other argument follows it. */
function standalone(
  flag: string,
  rest: readonly string[],
  request: AutoMovieCommand,
): AutoMovieCommand {
  if (rest.length !== 0) throw new Error(`${flag} must be the only argument.`);
  return request;
}
