import { markdownFiles } from "./markdownFiles";
import { normalizeFile } from "./normalizeFile";

/**
 * Selects an explicit safe population or the complete Markdown union.
 *
 * @evidence contracts/common.md#principled-implementation Choose normalized explicit files or both Markdown inventories, then deduplicate and sort names.
 * @evidence contracts/common.md#clear-and-simple-design Population selection precedes separate physical-file safety checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both roots contribute so additions and removals remain detectable; explicit paths cannot bypass normalization.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes explicit selection from complete Markdown union.
 * @evidence contracts/performance.md#efficient-algorithms Inventory visits both trees when needed; sets use O(F) names and sorting uses O(F log F) path comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Set removes duplicates before comparison; independent root inventories cannot be assumed equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned names and temporary sets grow with population; no persistent cache or fixed cap is imposed.
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
