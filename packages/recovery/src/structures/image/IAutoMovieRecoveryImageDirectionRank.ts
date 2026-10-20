/**
 * Conditional rank diagnostics for the two supplied-camera designs.
 *
 * @evidence contracts/common.md#principled-implementation Separate singular-value ratios describe the squared-radius and centre-projection camera designs.
 * @evidence contracts/common.md#clear-and-simple-design Both dimensionless diagnostics remain beside the fit rather than entering generating coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A camera-design rank ratio does not certify supplied calibration, surface correspondence or hidden shape.
 * @evidence contracts/common.md#meaningful-documentation Names the two design matrices and the dimensionless rank-ratio interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
 */
export interface IAutoMovieRecoveryImageDirectionRank {
  /** Squared-radius support design singular-value ratio. */
  radii: number;

  /** Centre-projection design singular-value ratio. */
  centres: number;
}
