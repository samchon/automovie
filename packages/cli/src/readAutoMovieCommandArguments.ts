import { type AutoMovieCommand } from "./AutoMovieCommand";
import { readAutoMovieSyncArguments } from "./readAutoMovieSyncArguments";

/**
 * Resolve one complete CLI request before any scaffold publication begins.
 *
 * `args` excludes the node executable and script positions. No arguments, or a lone `-h`/`--help`, means help; a lone `-v`/`--version` means version. `start` takes exactly one non-blank target directory and an optional single `--force`, in either order. `sync` takes one target, an optional single `--check` and an optional single `--baseline` directory. There is no `--` terminator, so a directory beginning with `-` must be spelled `./-name`. Every refusal throws an `Error` whose message names the correction.
 *
 * @evidence contracts/common.md#principled-implementation A single left-to-right pass classifies each `start` token as the one known flag, an unknown option by its leading `-`, or a positional, and the whole request is validated before returning, so `run` never begins publication on a partially understood command line; the premise is that no admitted directory starts with `-`, which the `./-name` spelling preserves.
 * @evidence contracts/common.md#clear-and-simple-design Start uses a direct flag scan and sync delegates its distinct check/baseline grammar, avoiding an argument-parsing dependency; standalone help and version are decided first because they admit no other token.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The flag spellings are the documented CLI contract, not special cases; every other token is refused with a message rather than ignored, and no fallback admits a removed command.
 * @evidence contracts/common.md#meaningful-documentation The comment states which argv positions `args` excludes, what the standalone flags mean, both command grammars including the missing `--` terminator and its `./-name` workaround, and that every refusal throws an `Error` naming the correction.
 * @evidence contracts/performance.md#efficient-algorithms The rest copy and classification scan take linear work in argument count, and checking the chosen directory for blankness additionally scans its characters; refusal messages serialize the offending token. The two local arrays retain at most one reference per argument, without copying token strings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure parser handles one supplied vector per call and coordinates no requests, phases, or effectful work that would require a shared result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parser opens no handle or task and retains no array after return; returned requests keep only their admitted strings and flags.
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
  if (command === "sync") return readAutoMovieSyncArguments(rest);
  if (command !== "start")
    throw new Error(
      `Unknown command ${JSON.stringify(command)}; the commands are start and sync (see --help).`,
    );

  const positionals: string[] = [];
  let force: boolean = false;
  for (const token of rest) {
    if (token === "--force") {
      if (force)
        throw new Error("--force may be supplied only once for start.");
      force = true;
    } else if (token.startsWith("-"))
      throw new Error(
        `Unknown start option ${JSON.stringify(token)}; start accepts only --force (spell a directory beginning with - as ./${token}).`,
      );
    else positionals.push(token);
  }
  if (positionals.length !== 1)
    throw new Error(
      `start needs exactly one target directory; received ${positionals.length}.`,
    );
  const [directory]: string[] = positionals;
  if (directory.trim().length === 0)
    throw new Error("start needs a non-blank target directory.");
  return { command: "start", directory, force };
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
