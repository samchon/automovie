/**
 * Conditional rank diagnostics for the two supplied-camera designs.
 *
 * @evidence contracts/development/design.md#principled-representation Separate singular-value ratios describe the squared-radius and centre-projection camera designs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both dimensionless diagnostics remain beside the fit rather than entering generating coefficients.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A camera-design rank ratio does not certify supplied calibration, surface correspondence or hidden shape.
 * @evidence contracts/development/common.md#meaningful-documentation Names the two design matrices and the dimensionless rank-ratio interpretation.
 */
export interface IAutoMovieRecoveryImageDirectionRank {
  /** Squared-radius support design singular-value ratio. */
  radii: number;

  /** Centre-projection design singular-value ratio. */
  centres: number;
}
