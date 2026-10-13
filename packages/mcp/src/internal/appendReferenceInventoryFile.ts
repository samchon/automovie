import { MAX_FILES } from "./MAX_FILES";
import { fail } from "./fail";

/**
 * Append one already-admitted Markdown identity to the current inventory. The exact 10,000th file is valid; the next refuses the complete result instead of publishing a truncated population. The caller owns this mutable inventory.
 *
 *
 * @evidence contracts/common.md#principled-implementation One already-admitted Markdown identity is appended, and the first population above 10,000 refuses the complete inventory.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the count boundary while traversal owns identity and filename admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The valid 10,000th entry is retained; over-limit inventories are not published as silently truncated success.
 * @evidence contracts/common.md#meaningful-documentation The comment states caller-owned mutation and inclusive limit; refusal occurs after the attempted append.
 * @evidence contracts/performance.md#efficient-algorithms One append and length comparison take amortized O(1); full directory and ancestry observation costs belong to createAutoMovieReferenceReader.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing mutable inventory is extended directly without rescanning previously admitted paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the inventory until request completion or failure; the helper owns no independent storage or descriptor.
 */
export function appendReferenceInventoryFile(files: string[], file: string): void {
  files.push(file);
  if (files.length > MAX_FILES)
    fail("RESOURCE_LIMIT", "Layer exceeds the 10,000 file limit.");
}
