/**
 * Retargeting keeps authored root quaternions while root translation may scale.
 * No automatic heading or axis reconciliation is represented by this policy.
 *
 * @evidence contracts/development/design.md#principled-representation The sole literal records unchanged root rotation in retargetMotion rather than claiming a heading conversion the implementation never applies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Names the root-rotation invariant separately from characterization's translation multiplier.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored facing is preserved for every skeleton, without imported rig names triggering hidden compensation.
 * @evidence contracts/development/common.md#meaningful-documentation States quaternion preservation, independently scaled translation and absence of automatic heading conversion.
 */
export type AutoMovieRetargetFacing = "preserve-authored";
