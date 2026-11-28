/**
 * Positive safe integer limits for the resident three-view camera map. The map
 * owns aggregate image and matching limits, linked populations, resection
 * proposals, and limits for its numerical designs. Seed-pair work has an
 * independent budget.
 */
export interface IAutoMovieRecoveryCameraMapBudget {
  /** Maximum total resident pixels across the three supplied views. */
  maxPixels: number;

  /**
   * Maximum total directed descriptor comparisons across all three unordered
   * view pairs, including both matching directions.
   */
  maxDescriptorPairs: number;

  /**
   * Maximum linked feature components before duplicate-view conflict or
   * geometric filtering.
   */
  maxTracks: number;

  /**
   * Maximum linked view-feature observations before duplicate-view conflict or
   * geometric filtering.
   */
  maxObservations: number;

  /**
   * Maximum six-point resection proposals, including numerically degenerate
   * proposals.
   */
  maxResectionTrials: number;

  /**
   * Minimum proposals before conditional-confidence stopping, no greater than
   * `maxResectionTrials`.
   */
  minimumResectionTrials: number;

  /** Maximum eligible resection proposals locally refined in draw order. */
  maxLocalRefinements: number;

  /**
   * Maximum total accepted and rejected iterations within one local resection
   * fit or joint fit.
   */
  maxRefinementIterations: number;

  /**
   * Maximum scalar entries for any original or augmented linear design and its
   * right basis.
   */
  maxLinearEntries: number;

  /** Maximum cyclic Jacobi sweeps per original-design decomposition. */
  maxSingularSweeps: number;
}
