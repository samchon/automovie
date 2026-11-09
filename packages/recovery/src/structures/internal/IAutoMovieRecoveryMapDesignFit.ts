/**
 * Physical least-squares step with independent original-design diagnostics.
 *
 * @evidence contracts/development/design.md#principled-representation The step restores column units, the design ratio measures undamped singular values, and gradient is the maximum scaled-design component of the residual gradient.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This named internal result separates the least-squares solve from geometric model acceptance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Damping does not provide original rank and these scalars do not certify photographic accuracy.
 * @evidence contracts/development/common.md#meaningful-documentation Step uses caller parameter coordinates; designRatio is dimensionless and gradient uses the column-normalized design.
 */
export interface IAutoMovieRecoveryMapDesignFit {
  /** Owned increment in the caller's original parameter coordinates. */
  step: number[];

  /** Smallest-to-largest singular value ratio of the undamped scaled design. */
  designRatio: number;

  /** Maximum absolute column-normalized residual-gradient component. */
  gradient: number;
}
