import { SCAFFOLD_SYNC_STATE_FILE } from "./SCAFFOLD_SYNC_STATE_FILE";
import { createScaffoldSyncState } from "./createScaffoldSyncState";

/**
 * Add the generated sync-state record, the digests of `files`' instruction files, at {@link SCAFFOLD_SYNC_STATE_FILE}.
 *
 * Every installation that holds `AGENTS.md` records the instruction bytes it adopted, so a later explicit sync can tell local edits from bundle updates.
 *
 * @param files A rendered installation; it is changed in place.
 * @returns The same map.
 * @throws When `files` already supplies the reserved state path.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The state is computed from the exact rendered instruction bytes it accompanies, after every layer is joined.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A single production and a workspace root attach their state through this one owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A scaffold file at the reserved address is refused instead of being overwritten.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what is recorded, why, the in-place change and the refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms One digest per instruction file, as createScaffoldSyncState computes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each installation is rendered and recorded once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The map gains one string and stays owned by the caller.
 */
export const attachScaffoldSyncState: (
  files: Record<string, string>,
) => Record<string, string> = (
  files: Record<string, string>,
): Record<string, string> => {
  if (SCAFFOLD_SYNC_STATE_FILE in files)
    throw new Error("The scaffold reserves its generated sync-state address.");
  files[SCAFFOLD_SYNC_STATE_FILE] = createScaffoldSyncState(files);
  return files;
};
