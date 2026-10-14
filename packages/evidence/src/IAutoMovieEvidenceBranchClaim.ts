import type { AutoMovieEvidenceBranch } from "./AutoMovieEvidenceBranch";
import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";

/**
 * A branch identity pairs with its native claim for factory and manifest assembly.
 *
 * @evidence contracts/common.md#principled-implementation A branch identity pairs with its native claim for factory and manifest assembly.
 * @evidence contracts/common.md#clear-and-simple-design The pair keeps internal ownership separate from native evaluator fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not copy or strengthen the contained claim's policy.
 * @evidence contracts/common.md#meaningful-documentation The constructor creates fresh pairs containing the original claim objects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; branchClaims allocates binding pairs consumed by graph and manifest assembly, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; branchClaims allocates binding pairs consumed by graph and manifest assembly, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; branchClaims allocates binding pairs consumed by graph and manifest assembly, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceBranchClaim {
  /** Declared stage owner used by manifest projection. */
  branch: AutoMovieEvidenceBranch;

  /** Native claim object retained without changing its policy. */
  claim: ITtscEvidenceGraphClaim;
}
