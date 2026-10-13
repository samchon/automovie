

/**
 * Five closed families distinguish discovery, naturalness, obligations, principles and upstream duties.
 *
 * @evidence contracts/common.md#principled-implementation Five closed families distinguish discovery, naturalness, obligations, principles and upstream duties.
 * @evidence contracts/common.md#clear-and-simple-design Family-specific reference construction selects checklist and coverage cardinality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The family type does not itself prove that a supplied basename exists.
 * @evidence contracts/common.md#meaningful-documentation The alternatives correspond to the physical generated docs directories.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; sharedReference resolves family and basename through EXPECTED_CONTRACTS, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; sharedReference resolves family and basename through EXPECTED_CONTRACTS, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; sharedReference resolves family and basename through EXPECTED_CONTRACTS, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieContractFamily =
  | "discovery"
  | "naturalness"
  | "obligations"
  | "principles"
  | "upstream";
