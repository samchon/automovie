

/**
 * Two mutable maps record target anchors and normalized titles with their owning file or anchor address.
 *
 * @evidence contracts/common.md#principled-implementation Two mutable maps record target anchors and normalized titles with their owning file or anchor address.
 * @evidence contracts/common.md#clear-and-simple-design Shared and local target admission use one registry to detect collisions across inventories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalized spelling detects duplicate identity only and does not act as a prose grader.
 * @evidence contracts/common.md#meaningful-documentation The caller owns the maps and production-target admission extends them in place.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; validateContracts allocates maps and validateProductionTargets extends them in the same admission, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; validateContracts allocates maps and validateProductionTargets extends them in the same admission, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; validateContracts allocates maps and validateProductionTargets extends them in the same admission, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceTargetIdentityRegistry {
  /** Mutable explicit-anchor keys mapped to their owning file and anchor address. */
  anchors: Map<string, string>;

  /** Mutable normalized-title keys mapped to their first admitted target address. */
  titles: Map<string, string>;
}
