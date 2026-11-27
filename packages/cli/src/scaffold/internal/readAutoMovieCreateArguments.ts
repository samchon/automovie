import type { AutoMovieCommand } from "../../command/AutoMovieCommand";
import { readAutoMovieNameOption } from "./readAutoMovieNameOption";

/**
 * Admit one `create` request: exactly one non-blank target directory with
 * optional single `--workspace`, `--force` and `--name <name>`, in any order.
 *
 * There is no `--` terminator, so a directory beginning with `-` must be
 * spelled `./-name`. Every refusal throws an `Error` whose message names the
 * correction.
 *
 * @param args The tokens after `create`.
 * @returns The admitted request.
 * @throws On an unknown or repeated option, a missing name value, or anything
 *   other than one non-blank directory.
 */
export function readAutoMovieCreateArguments(
  args: readonly string[],
): AutoMovieCommand {
  const positionals: string[] = [];
  let workspace: boolean = false;
  let force: boolean = false;
  let name: string | undefined;
  for (let index: number = 0; index < args.length; index++) {
    const token: string = args[index]!;
    if (token === "--force") {
      if (force)
        throw new Error("--force may be supplied only once for create.");
      force = true;
    } else if (token === "--workspace") {
      if (workspace)
        throw new Error("--workspace may be supplied only once for create.");
      workspace = true;
    } else if (token === "--name") {
      if (name !== undefined)
        throw new Error("--name may be supplied only once for create.");
      name = readAutoMovieNameOption(args[++index]);
    } else if (token.startsWith("-"))
      throw new Error(
        `Unknown create option ${JSON.stringify(token)}; create accepts --workspace, --name and --force (spell a directory beginning with - as ./${token}).`,
      );
    else positionals.push(token);
  }
  if (positionals.length !== 1)
    throw new Error(
      `create needs exactly one target directory; received ${positionals.length}.`,
    );
  const directory: string = positionals[0]!;
  if (directory.trim().length === 0)
    throw new Error("create needs a non-blank target directory.");
  return {
    command: "create",
    directory,
    workspace,
    force,
    ...(name === undefined ? {} : { name }),
  };
}
