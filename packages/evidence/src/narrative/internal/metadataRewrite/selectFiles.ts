import { markdownFiles } from "./markdownFiles";
import { normalizeFile } from "./normalizeFile";

/**
 * Selects an explicit safe population or the complete Markdown union.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Choose normalized explicit files or both Markdown inventories, then deduplicate and sort names.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Population selection precedes separate physical-file safety checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both roots contribute so additions and removals remain detectable; explicit paths cannot bypass normalization.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes explicit selection from complete Markdown union.
 * @evidence contracts/development/implementation.md#efficient-algorithms Inventory visits both trees when needed; sets use O(F) names and sorting uses O(F log F) path comparisons.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Set removes duplicates before comparison; independent root inventories cannot be assumed equivalent.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned names and temporary sets grow with population; no persistent cache or fixed cap is imposed.
 */
export function selectFiles(
  beforeRoot: string,
  afterRoot: string,
  selected: string[] | undefined,
): string[] {
  const files: string[] =
    selected === undefined
      ? [
          ...new Set([
            ...markdownFiles(beforeRoot),
            ...markdownFiles(afterRoot),
          ]),
        ]
      : selected.map(normalizeFile);
  return [...new Set(files)].sort((left: string, right: string): number =>
    left.localeCompare(right),
  );
}
