import type { AutoMovieCommand } from "./AutoMovieCommand";
import { readAutoMovieNameOption } from "./readAutoMovieNameOption";

/**
 * Admit one `create` request: exactly one non-blank target directory with optional single `--workspace`, `--force` and `--name <name>`, in any order.
 *
 * There is no `--` terminator, so a directory beginning with `-` must be spelled `./-name`. Every refusal throws an `Error` whose message names the correction.
 *
 * @param args The tokens after `create`.
 * @returns The admitted request.
 * @throws On an unknown or repeated option, a missing name value, or anything other than one non-blank directory.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A complete left-to-right scan admits each flag once and consumes `--name`'s value, so every token is classified before any filesystem work.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The create grammar is separate from add; `readAutoMovieNameOption` owns the shared value rule and `run` owns resolution.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default directory, inferred workspace mode or derived name is introduced here.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the grammar, the dash-leading spelling and that refusals name their correction.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan over the tokens.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure parser owns no cross-request effect to reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Local strings and arrays expire after return and no handle is acquired.
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
