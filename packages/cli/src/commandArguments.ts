/** One admitted CLI request. */
export type AutoMovieCommand =
  | { command: "help" }
  | { command: "version" }
  | { command: "start"; directory: string; force: boolean };

/**
 * Resolve one complete CLI request before any scaffold publication begins.
 *
 * `args` excludes the node executable and script positions. No arguments, or a
 * lone `-h`/`--help`, means help; a lone `-v`/`--version` means version.
 * `start` takes exactly one target directory and an optional single `--force`;
 * there is no `--` terminator, so a directory beginning with `-` must be spelled
 * `./-name`. Every refusal throws an `Error` whose message names the
 * correction.
 */
export function readAutoMovieCommandArguments(
  args: readonly string[],
): AutoMovieCommand {
  if (
    args.length === 0 ||
    (args.length === 1 && (args[0] === "-h" || args[0] === "--help"))
  )
    return { command: "help" };
  if (args.length === 1 && (args[0] === "-v" || args[0] === "--version"))
    return { command: "version" };

  const [command, ...rest]: readonly string[] = args;
  if (command !== "start")
    throw new Error(`Unknown command ${JSON.stringify(command ?? "")}.`);
  const positionals: string[] = [];
  let force: boolean = false;
  for (const token of rest) {
    if (token === "--force") {
      if (force)
        throw new Error("--force may be supplied only once for start.");
      force = true;
    } else if (token.startsWith("-"))
      throw new Error(`Unknown start option "${token}".`);
    else positionals.push(token);
  }
  const directory: string | undefined = positionals[0];
  if (
    positionals.length !== 1 ||
    directory === undefined ||
    directory.trim().length === 0
  )
    throw new Error(
      `start needs exactly one non-blank target directory; received ${positionals.length}.`,
    );
  return { command: "start", directory, force };
}
