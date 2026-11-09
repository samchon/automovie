import { assertScaffoldProjectName } from "@automovie/template";

import type { AutoMovieCommand } from "./AutoMovieCommand";
import { readAutoMovieNameOption } from "./readAutoMovieNameOption";

/**
 * Admit one `add` request: exactly one `shorts/<directory>` or `series/<directory>` target with optional single `--force` and `--name <name>`, in any order.
 *
 * The target is split at its one `/`; the family must be `shorts` or `series`, and the directory must be one segment that the template's project-name rule admits unchanged, so `movies/<family>/<directory>` cannot leave the workspace. Every refusal throws an `Error` whose message names the correction.
 *
 * @param args The tokens after `add`.
 * @returns The admitted request.
 * @throws On an unknown or repeated option, a missing name value, a target count other than one, an unknown family, or a refused directory segment.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The directory segment passes the same portable-segment rule as a project name and must equal its trimmed form, so no separator, `.`, `..` or padding reaches the joined path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The add grammar is separate from create and sync; the template owns the segment rule and `run` owns the workspace path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No family is inferred from the name and no workspace is searched for; the family is typed explicitly.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the grammar, the family pair, the segment rule and why it matters, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan over the tokens and one split of the target.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure parser owns no cross-request effect to reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Local strings and arrays expire after return and no handle is acquired.
 */
export function readAutoMovieAddArguments(
  args: readonly string[],
): AutoMovieCommand {
  const positionals: string[] = [];
  let force: boolean = false;
  let name: string | undefined;
  for (let index: number = 0; index < args.length; index++) {
    const token: string = args[index]!;
    if (token === "--force") {
      if (force) throw new Error("--force may be supplied only once for add.");
      force = true;
    } else if (token === "--name") {
      if (name !== undefined)
        throw new Error("--name may be supplied only once for add.");
      name = readAutoMovieNameOption(args[++index]);
    } else if (token.startsWith("-"))
      throw new Error(
        `Unknown add option ${JSON.stringify(token)}; add accepts --name and --force.`,
      );
    else positionals.push(token);
  }
  if (positionals.length !== 1)
    throw new Error(
      `add needs exactly one shorts/<name> or series/<name> target; received ${positionals.length}.`,
    );

  // Split the one target into its closed family and one directory segment.
  const parts: string[] = positionals[0]!.split("/");
  const family: string = parts[0]!;
  if (parts.length !== 2 || (family !== "shorts" && family !== "series"))
    throw new Error(
      `add needs a shorts/<name> or series/<name> target; received ${JSON.stringify(positionals[0])}.`,
    );
  const directory: string = parts[1]!;
  let admitted: string;
  try {
    admitted = assertScaffoldProjectName(directory);
  } catch (cause) {
    throw new Error(
      `add needs one portable directory name after ${family}/; received ${JSON.stringify(directory)}.`,
      { cause },
    );
  }
  if (admitted !== directory)
    throw new Error(
      `add needs a directory name without surrounding spaces; received ${JSON.stringify(directory)}.`,
    );
  return {
    command: "add",
    family,
    directory,
    force,
    ...(name === undefined ? {} : { name }),
  };
}
