import type {
  AutoMovieDiagnosticNumber,
  AutoMovieDiagnosticScalars,
  IAutoMovieRecoveryFeasibleDirectionReport,
  IAutoMovieRecoveryFeasibleTrials,
  IAutoMovieRecoverySqpReport,
} from "..";

/**
 * Complete fixed feasible-fit diagnostics, separate from accepted geometry. All
 * nonfinite quantities have explicit JSON sentinels. These are computed
 * algorithm reports, not independently reconstructed certificates or history.
 */
export interface IAutoMovieRecoveryFeasibleDiagnostics {
  /**
   * Actual finite positive generic normal tolerance; support floor is its
   * square root and the inner gap target its square, not separate knobs.
   */
  tolerance: number;

  /**
   * Last checked objective-row multiplier, or unavailable before a direction
   * supplies it. This scalar is not a multiplier history or independent dual
   * certificate.
   */
  objectiveMultiplier: AutoMovieDiagnosticNumber | null;

  /**
   * Last maximum original-coordinate Lagrangian gradient component; null
   * denotes unsupported objective-multiplier normalization, sentinels denote
   * computed nonfinite values.
   */
  stationarity: AutoMovieDiagnosticNumber | null;

  /**
   * Last original objective-gradient scale, independent of geometric error
   * units.
   */
  stationarityScale: AutoMovieDiagnosticNumber | null;

  /**
   * Last maximum absolute normalized physical multiplier times nonlinear
   * constraint value; null denotes unsupported normalization.
   */
  complementarity: AutoMovieDiagnosticNumber | null;

  /**
   * Last physical normal passed the unchanged finite/residual checks; baseline
   * direction certification is independently necessary.
   */
  normalKktQualified: boolean;

  /**
   * Conservative direction, physical certificate, optional arc and generic
   * fixed metadata visits; excludes selector visits and camera geometry.
   */
  directionWork: AutoMovieDiagnosticNumber;

  /**
   * Last baseline QP's21 scalar fields, including terminal checks; arithmetic
   * qualification does not imply requested exact-gap or nonlinear convergence.
   */
  lastDirection: AutoMovieDiagnosticScalars<IAutoMovieRecoveryFeasibleDirectionReport> | null;

  /**
   * Latest optional arc's20 fields and nullable five-field tightening record;
   * it may predate the terminal QP/normal check.
   */
  lastSqp: AutoMovieDiagnosticScalars<IAutoMovieRecoverySqpReport> | null;

  /**
   * Whole-fit11-field path/outcome marginals and selector visits; no
   * path-by-outcome table or selected-path labels. lastFailure can predate
   * later progress.
   */
  trials: AutoMovieDiagnosticScalars<IAutoMovieRecoveryFeasibleTrials>;
}
