/**
 * Retargeting keeps authored root quaternions while root translation may scale.
 * No automatic heading or axis reconciliation is represented by this policy.
 *
 * @evidence contracts/common.md#principled-implementation The sole literal records unchanged root rotation in retargetMotion rather than claiming a heading conversion the implementation never applies.
 * @evidence contracts/common.md#clear-and-simple-design Names the root-rotation invariant separately from characterization's translation multiplier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored facing is preserved for every skeleton, without imported rig names triggering hidden compensation.
 * @evidence contracts/common.md#meaningful-documentation States quaternion preservation, independently scaled translation and absence of automatic heading conversion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A facing marker executes no rotation calculation or runtime data-structure choice.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The preserved-facing label coordinates no work and implies no transform cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This marker retains no root samples or frame history beyond its containing characterization.
 */
export type AutoMovieRetargetFacing = "preserve-authored";
