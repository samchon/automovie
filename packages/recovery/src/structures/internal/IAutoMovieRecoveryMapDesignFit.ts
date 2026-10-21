/**
 * Physical least-squares step with independent original-design diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation The step restores column units, the design ratio measures undamped singular values, and gradient is the maximum scaled-design component of the residual gradient.
 * @evidence contracts/common.md#clear-and-simple-design This named internal result separates the least-squares solve from geometric model acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Damping does not provide original rank and these scalars do not certify photographic accuracy.
 * @evidence contracts/common.md#meaningful-documentation Step uses caller parameter coordinates; designRatio is dimensionless and gradient uses the column-normalized design.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no factorization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one bounded step and two scalars without factors or external resources.
 */
export interface IAutoMovieRecoveryMapDesignFit {
  /** Owned increment in the caller's original parameter coordinates. */
  step: number[];

  /** Smallest-to-largest singular value ratio of the undamped scaled design. */
  designRatio: number;

  /** Maximum absolute column-normalized residual-gradient component. */
  gradient: number;
}
