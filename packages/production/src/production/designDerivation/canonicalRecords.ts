import { compareCodeUnits } from "../contentIdentity";
import type { IAutoMovieDesignDerivationRecord } from "./IAutoMovieDesignDerivationRecord";
import { canonicalBasis } from "./canonicalBasis";
import { assertRelativePath } from "./assertRelativePath";

/**
 * Sort recorded lineage and validate unique target/path membership and basis metadata.
 *
 * @evidence contracts/common.md#principled-implementation Code-unit sorts a copied record array, rejects duplicate targets/paths and validates each stored basis through canonicalBasis.
 * @evidence contracts/common.md#clear-and-simple-design Inventory rules stay together while basis rules remain shared with current-basis acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Record objects are borrowed rather than deeply cloned, and this helper does not validate output bytes or authenticate stored digests.
 * @evidence contracts/common.md#meaningful-documentation Documents sorted-array ownership, repeated identities and the separate digest/currentness checks in inspection.
 * @evidence contracts/performance.md#efficient-algorithms Record sorting adds O(n log n) comparisons; two Set passes and per-record basis validation/sorting remain part of the total cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses shared basis validation without caching record currentness; inspection separately compares current metadata and bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new array borrows original records through this call/result; temporary Sets and copied validation bases retire without native resources.
 */
export function canonicalRecords(
  records: readonly IAutoMovieDesignDerivationRecord[],
): readonly IAutoMovieDesignDerivationRecord[] {
  const sorted: IAutoMovieDesignDerivationRecord[] = [...records].sort((left: IAutoMovieDesignDerivationRecord, right: IAutoMovieDesignDerivationRecord): number =>
    compareCodeUnits(left.target, right.target),
  );
  if (new Set(sorted.map((record: IAutoMovieDesignDerivationRecord): string => record.target)).size !== sorted.length)
    throw new Error("Design-derivation manifest repeats a target identity.");
  if (new Set(sorted.map((record: IAutoMovieDesignDerivationRecord): string => record.recordPath)).size !== sorted.length)
    throw new Error("Design-derivation manifest repeats a record path.");
  for (const record of sorted) {
    assertRelativePath(record.recordPath);
    canonicalBasis(record.basis);
  }
  return sorted;
}
