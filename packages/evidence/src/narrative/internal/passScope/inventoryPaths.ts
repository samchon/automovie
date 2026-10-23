import {
  type IEvidenceInventory,
  type IEvidenceSourceAddress,
  type IEvidenceSourceDependency,
  type IEvidenceSourceFile,
} from "@wrtnlabs/evidence";

/**
 * Collects physical, logical, and absent-source dependency paths from one captured inventory.
 *
 * @evidence contracts/common.md#principled-implementation Physical source paths, every logical source address and absent-source dependency paths are unioned and sorted, retaining each distinct original spelling for the pass input inventory.
 * @evidence contracts/common.md#clear-and-simple-design A Set supplies deduplication and an explicit lexical comparator supplies deterministic ordering without changing canonical source identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing dependency or unselected address is dropped merely because it lacks a materialized source unit.
 * @evidence contracts/common.md#meaningful-documentation The comment names all three path sources and identifies the input as one captured inventory.
 * @evidence contracts/performance.md#efficient-algorithms For n addresses/dependencies and u distinct path strings, collection costs O(n) and lexical sorting O(u log u) comparisons, using O(n + u) transient references plus string comparison cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing inventory records are reused as string references; this helper does not resolve paths again or share a stale cross-analysis result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and the deduplication Set die after return; the sorted path array is caller-owned and grows only with the captured inventory.
 */
export function inventoryPaths(inventory: IEvidenceInventory): string[] {
  return [
    ...new Set([
      ...inventory.sources.flatMap((source: IEvidenceSourceFile): string[] => [
        source.physicalPath,
        ...source.addresses.map(
          (address: IEvidenceSourceAddress): string => address.absolute,
        ),
      ]),
      ...inventory.dependencies.map(
        (dependency: IEvidenceSourceDependency): string => dependency.path,
      ),
    ]),
  ].sort((left: string, right: string): 1 | -1 | 0 =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}
