

/**
 * One authoring branch's current enforcement state.
 *
 * @evidence contracts/common.md#principled-implementation Disabled, draft, evidence and review encode declared lifecycle state rather than measured success.
 * @evidence contracts/common.md#clear-and-simple-design Active and completed predicates interpret this one vocabulary separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Review remains accepted but does not imply an automatic prose grader or receipt.
 * @evidence contracts/common.md#meaningful-documentation Draft has physical hosts; evidence and review enable native coverage duties.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; isActive and requiresEvidence classify lifecycle values, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; isActive and requiresEvidence classify lifecycle values, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; isActive and requiresEvidence classify lifecycle values, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieEvidenceStage =
  | "disabled"
  | "draft"
  | "evidence"
  | "review";
