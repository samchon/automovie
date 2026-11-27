import { type AutoMovieCommand } from "../AutoMovieCommand";
import { AutoMovieCliScaffold } from "../../scaffold/AutoMovieCliScaffold";

/*
 * Resolve one complete CLI request before any scaffold publication begins.
 *
 * `args` excludes the node executable and script positions. No arguments, or a
 * lone `-h`/`--help`, means help; a lone `-v`/`--version` means version.
 * `create` and `add` delegate their grammars to
 * AutoMovieCliScaffold.readCreateArguments and
 * AutoMovieCliScaffold.readAddArguments. Production operations keep
 * their tokens for their own option reader. Every refusal throws an `Error`
 * whose message names the correction.
 * Parameter args: The command-line tokens after the executable and script.
 * Returns: The admitted request.
 * On an unknown command or any refusal of the delegated grammar.
 */
export function readCommandArguments(
  args: readonly string[],
): AutoMovieCommand {
  if (args.length === 0) return { command: "help" };
  const [command, ...rest]: readonly string[] = args;
  if (command === "-h" || command === "--help")
    return standalone(command, rest, { command: "help" });
  if (command === "-v" || command === "--version")
    return standalone(command, rest, { command: "version" });
  if (command === "create")
    return AutoMovieCliScaffold.readCreateArguments(rest);
  if (command === "add") return AutoMovieCliScaffold.readAddArguments(rest);
  if (command === "capture") return { command: "capture", args: [...rest] };
  if (command === "inspect") return { command: "inspect", args: [...rest] };
  if (command === "render") return { command: "render", args: [...rest] };
  if (command === "review") return { command: "review", args: [...rest] };
  if (command === "check") return { command: "check", args: [...rest] };
  throw new Error(
    `Unknown command ${JSON.stringify(command)}; the commands are create, add, capture, inspect, render, review and check (see --help).`,
  );
}

/*
 * Admit a standalone flag only when no other argument follows it.
 */
function standalone(
  flag: string,
  rest: readonly string[],
  request: AutoMovieCommand,
): AutoMovieCommand {
  if (rest.length !== 0) throw new Error(`${flag} must be the only argument.`);
  return request;
}
