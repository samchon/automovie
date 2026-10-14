import { IAutoMovieLegacyImportInventoryEntry } from "@automovie/interface";

/**
 * Compare ordered file inventories by path, byte count, digest and kind at every index. The caller separately establishes sorted canonical paths and obtains current byte-grounded digests.
 *
 * @evidence contracts/common.md#principled-implementation Exact field equality checks the full represented inventory identity rather than only names or digest spelling.
 * @evidence contracts/common.md#clear-and-simple-design One comparator supplies pre-import baseline preservation after current content is recaptured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No changed kind, missing entry or byte count is ignored; array-order equivalence is a premise rather than silently normalized here.
 * @evidence contracts/common.md#meaningful-documentation States every compared field and the separate canonical/current-content witnesses.
 * @evidence contracts/performance.md#efficient-algorithms For F entries, performs a linear indexed pass with path/digest string comparison costs and constant auxiliary references.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares already computed inventory records without rehashing them, while live byte capture remains with the enclosing baseline owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no input inventory after return and opens no file; caller-owned arrays/digest strings determine their own data lifetime.
 */
export const legacyImporterSameInventory: (left: readonly IAutoMovieLegacyImportInventoryEntry[], right: readonly IAutoMovieLegacyImportInventoryEntry[]) => boolean = (
  left: readonly IAutoMovieLegacyImportInventoryEntry[],
  right: readonly IAutoMovieLegacyImportInventoryEntry[],
): boolean =>
  left.length === right.length &&
  left.every((entry: IAutoMovieLegacyImportInventoryEntry, index: number): boolean => {
    const other: IAutoMovieLegacyImportInventoryEntry = right[index];
    return (
      other !== undefined &&
      entry.path === other.path &&
      entry.bytes === other.bytes &&
      entry.digest === other.digest &&
      entry.kind === other.kind
    );
  });
