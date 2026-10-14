import { compareCodeUnits } from "./contentIdentity";
import { productionRootNamespaceAcquireCoordinate } from "./productionRootNamespaceAcquireCoordinate";
import { productionRootNamespaceReleaseCoordinate } from "./productionRootNamespaceReleaseCoordinate";
import { productionRootNamespaceContendedCoordinatesError } from "./productionRootNamespaceContendedCoordinatesError";

/**
 * Deduplicate and sort coordinate paths before acquiring them in deterministic order. On failure, attempt release of already acquired levels in reverse order, then describe the current contended coordinate set.
 *
 * @evidence contracts/common.md#principled-implementation A total code-unit path order avoids inconsistent multi-lock acquisition order and duplicate paths acquire one level per set; failure unwinds the actual acquired prefix.
 * @evidence contracts/common.md#clear-and-simple-design Owns set ordering and acquired-prefix cleanup, while single-coordinate acquisition and contention surveys stay at their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No partial acquired set is returned after failure; cleanup uses acquired tokens rather than guessing which requested paths were owned.
 * @evidence contracts/common.md#meaningful-documentation Documents deterministic set order, duplicate handling and reverse failure unwind without promising physical release success from the underlying void API.
 * @evidence contracts/performance.md#efficient-algorithms For N requested paths and C distinct paths, deduplication visits N entries and sorting makes O(C log C) code-unit comparisons, with text hashing/comparison costs driven by the path strings. Acquisition/refusal surveys add their token and native wait costs, with O(C) lease records and sorted references.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent path entries are deduplicated within this set and existing process depth is shared by the underlying lock owner; different calls still acquire their own levels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned array owns C acquired levels until caller release; a failed acquisition attempts reverse cleanup, with unresolved physical failures governed by commit-lock retirement.
 */
export const productionRootNamespaceAcquireCoordinates: (paths: readonly string[]) => Array<{ path: string; token: string }> = (
  paths: readonly string[],
): Array<{ path: string; token: string }> => {
  const leases: Array<{ path: string; token: string }> = [];
  try {
    for (const lockPath of [...new Set(paths)].sort(compareCodeUnits)) {
      leases.push(productionRootNamespaceAcquireCoordinate(lockPath));
    }
    return leases;
  } catch (error) {
    for (const lease of leases.reverse()) productionRootNamespaceReleaseCoordinate(lease);
    throw productionRootNamespaceContendedCoordinatesError(paths, error);
  }
};
