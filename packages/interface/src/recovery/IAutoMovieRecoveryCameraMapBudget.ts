/**
 * Positive integer work limits for calibrated camera-map phases.
 * Seed observation and epipolar work retain their separate pair budget.
 *
 * @evidence contracts/development/design.md#principled-representation Aggregate pixels, automatic comparisons, tracks, observations, proposals and linear entries are distinct bounded work populations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Admission and each owning phase check their relevant limits before allocation or traversal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A work ceiling supplies no missing observation or convergence guarantee and is never increased after a failed fit.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish aggregate, retained and per-solve limits including the separate minimum trial requirement.
 */
export interface IAutoMovieRecoveryCameraMapBudget {
  /** Aggregate resident pixels across every supplied view in the owning operation. */
  maxPixels: number;

  /** Aggregate directed descriptor comparisons over all admitted image pairs. */
  maxDescriptorPairs: number;

  /** Maximum linked feature components before conflict or geometry filtering. */
  maxTracks: number;

  /** Maximum linked (view, feature) observations before conflict filtering. */
  maxObservations: number;

  /** Maximum six-point resection proposals, including degenerate proposals. */
  maxResectionTrials: number;

  /** Minimum proposals before conditional stopping, no greater than maxResectionTrials. */
  minimumResectionTrials: number;

  /** Maximum eligible resection proposals locally refined in draw order. */
  maxLocalRefinements: number;

  /** Maximum accepted and rejected iterations combined per local pose or joint fit. */
  maxRefinementIterations: number;

  /** Maximum entries in any original or augmented linear design and its right basis. */
  maxLinearEntries: number;

  /** Maximum cyclic Jacobi sweeps per original-design decomposition. */
  maxSingularSweeps: number;
}
