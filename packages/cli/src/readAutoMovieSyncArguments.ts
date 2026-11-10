import type { AutoMovieCommand } from "./AutoMovieCommand";

/**
 * Admit one explicit instruction-sync request before reading the production.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A complete left-to-right token scan admits one target, at most one check flag and one nonblank baseline, rejecting unknown or repeated options before filesystem work.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This sync grammar is separate from create's and add's force semantics; run owns resolution and template owns planning/publication.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default target, wildcard expansion, force overwrite or inferred baseline is admitted; directory names beginning with a dash require ./ spelling.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies admission before reads, while errors give flag, value and target corrections.
 * @evidence contracts/development/implementation.md#efficient-algorithms One argument scan and value blank checks cost total input characters; the local positional list is bounded by argument count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure parser owns no cross-request effects to reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Local strings/arrays expire after return and no handle or task is acquired.
 */
export function readAutoMovieSyncArguments(
  args: readonly string[],
): AutoMovieCommand {
  const directories: string[] = [];
  let check: boolean = false;
  let baseline: string | undefined;
  for (let index: number = 0; index < args.length; index++) {
    const token: string = args[index];
    if (token === "--check") {
      if (check) throw new Error("--check may be supplied only once for sync.");
      check = true;
    } else if (token === "--baseline") {
      if (baseline !== undefined)
        throw new Error("--baseline may be supplied only once.");
      const value: string | undefined = args[++index];
      if (value === undefined || value.startsWith("-") || value.trim() === "")
        throw new Error(
          "--baseline needs one non-blank directory (spell a dash-leading directory as ./-name).",
        );
      baseline = value;
    } else if (token.startsWith("-")) {
      throw new Error(
        `Unknown sync option ${JSON.stringify(token)}; sync accepts --check and --baseline.`,
      );
    } else directories.push(token);
  }
  if (directories.length !== 1 || directories[0].trim() === "")
    throw new Error("sync needs exactly one non-blank target directory.");
  return {
    command: "sync",
    directory: directories[0],
    check,
    ...(baseline === undefined ? {} : { baseline }),
  };
}
