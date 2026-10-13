/**
 * One admitted CLI request, discriminated by `command`.
 *
 * `help` and `version` carry nothing because they are standalone requests.
 * `start` carries the target directory exactly as typed, relative or absolute,
 * which `run` resolves against the working directory.
 *
 * @evidence contracts/common.md#principled-implementation A string-literal discriminated union lets TypeScript narrow each request by `command`, so `run` cannot read a `start` field on a help or version request; the `start` directory stays unresolved because resolution depends on the caller's working directory, which `run` owns.
 * @evidence contracts/common.md#clear-and-simple-design The union has exactly the three requests the CLI admits and only the two `start` facts the scaffold publication consumes, with no option bag for flags the parser refuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No member encodes a default directory or a test fixture; `force` is always present as a boolean, so absence never stands for a hidden third state.
 * @evidence contracts/common.md#meaningful-documentation The comment says that help and version are standalone and carry nothing, that the directory is unresolved and who resolves it, and each `start` member says how `run` uses it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union is a compile-time type and chooses no algorithm or data structure at runtime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This union is a compile-time type and coordinates no work across requests or phases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This union is a compile-time type and owns no retained state, handle, or task.
 */
export type AutoMovieCommand =
  | {
      /** Print the usage text. */
      command: "help";
    }
  | {
      /** Print this package's version. */
      command: "version";
    }
  | {
      /** Install the scaffold into `directory`. */
      command: "start";

      /** Target directory as typed, never blank; `run` resolves it against the working directory. */
      directory: string;

      /** Admit a non-empty target, as `publishFiles`' `force` option defines it. */
      force: boolean;
    };

/**
 * Resolve one complete CLI request before any scaffold publication begins.
 *
 * `args` excludes the node executable and script positions. No arguments, or a
 * lone `-h`/`--help`, means help; a lone `-v`/`--version` means version.
 * `start` takes exactly one non-blank target directory and an optional single
 * `--force`, in either order. There is no `--` terminator, so a directory
 * beginning with `-` must be spelled `./-name`. Every refusal throws an `Error`
 * whose message names the correction.
 *
 * @evidence contracts/common.md#principled-implementation A single left-to-right pass classifies each `start` token as the one known flag, an unknown option by its leading `-`, or a positional, and the whole request is validated before returning, so `run` never begins publication on a partially understood command line; the premise is that no admitted directory starts with `-`, which the `./-name` spelling preserves.
 * @evidence contracts/common.md#clear-and-simple-design The grammar has one command and one flag, so a direct scan replaces an argument-parsing dependency; standalone help and version are decided first because they admit no other token.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The flag spellings are the documented CLI contract, not special cases; every other token is refused with a message rather than ignored, and no fallback admits a removed command.
 * @evidence contracts/common.md#meaningful-documentation The comment states which argv positions `args` excludes, what the standalone flags mean, the `start` grammar including the missing `--` terminator and its `./-name` workaround, and that every refusal throws an `Error` naming the correction.
 * @evidence contracts/performance.md#efficient-algorithms Time and space are linear in the number of arguments: one pass over the `start` tokens with one positional array, and no token is examined twice.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parsing runs once per process on one argument vector, so there is no equivalent request whose result could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parser holds only local arrays released on return and opens no handle or task.
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
  if (command !== "start")
    throw new Error(
      `Unknown command ${JSON.stringify(command)}; the only command is start (see --help).`,
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
  if (rest.length !== 0)
    throw new Error(`${flag} must be the only argument.`);
  return request;
}
