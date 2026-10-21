import type { IAutoMovieRecoveryFeasibleDirectionReport } from "../internal/IAutoMovieRecoveryFeasibleDirectionReport";
import type { IAutoMovieRecoveryFeasibleTrials } from "../internal/IAutoMovieRecoveryFeasibleTrials";
import type { IAutoMovieRecoverySqpReport } from "../internal/IAutoMovieRecoverySqpReport";
import type { AutoMovieRecoveryDiagnosticScalars } from "./AutoMovieRecoveryDiagnosticScalars";
import type { IAutoMovieRecoveryDiagnosticNumber } from "./IAutoMovieRecoveryDiagnosticNumber";

/**
 * Complete fixed feasible-fit diagnostics, separate from accepted geometry.
 * All nonfinite quantities have explicit JSON sentinels. These are computed
 * algorithm reports, not independently reconstructed certificates or history.
 *
 * @evidence contracts/common.md#principled-implementation Keeps physical normal, baseline QP, optional arc, actual-trial marginals and charged visits distinct on one unchanged fit population.
 * @evidence contracts/common.md#clear-and-simple-design One optional MapJointFit block preserves every bounded generic report omitted by camera projection; shared count/cost and existing adaptive/curvature summaries are not duplicated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No state, array, factor, per-step history, invented model age or private multiplier vector is exposed, and diagnostic availability never supplies convergence.
 * @evidence contracts/common.md#meaningful-documentation Members state normal inputs, terminal versus older auxiliary ages, path/outcome marginals and visit units; scalar sentinels differ from unavailable null.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased report performs no solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no input-dependent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed records hold no geometry or handles; scene attempts can retain distinct blocks up to their declared attempt/fit bound, with aliases and trace copies accounted by their owner.
 */
export interface IAutoMovieRecoveryFeasibleDiagnostics {
  /** Actual finite positive generic normal tolerance; support floor is its square root and the inner gap target its square, not separate knobs. */
  tolerance: number;

  /** Last checked objective-row multiplier, or unavailable before a direction supplies it. This scalar is not a multiplier history or independent dual certificate. */
  objectiveMultiplier: IAutoMovieRecoveryDiagnosticNumber | null;

  /** Last maximum original-coordinate Lagrangian gradient component; null denotes unsupported objective-multiplier normalization, sentinels denote computed nonfinite values. */
  stationarity: IAutoMovieRecoveryDiagnosticNumber | null;

  /** Last original objective-gradient scale, independent of geometric error units. */
  stationarityScale: IAutoMovieRecoveryDiagnosticNumber | null;

  /** Last maximum absolute normalized physical multiplier times nonlinear constraint value; null denotes unsupported normalization. */
  complementarity: IAutoMovieRecoveryDiagnosticNumber | null;

  /** Last physical normal passed the unchanged finite/residual checks; baseline direction certification is independently necessary. */
  normalKktQualified: boolean;

  /** Conservative direction, physical certificate, optional arc and generic fixed metadata visits; excludes selector visits and camera geometry. */
  directionWork: IAutoMovieRecoveryDiagnosticNumber;

  /** Last baseline QP's21 scalar fields, including terminal checks; arithmetic qualification does not imply requested exact-gap or nonlinear convergence. */
  lastDirection: AutoMovieRecoveryDiagnosticScalars<IAutoMovieRecoveryFeasibleDirectionReport> | null;

  /** Latest optional arc's20 fields and nullable five-field tightening record; it may predate the terminal QP/normal check. */
  lastSqp: AutoMovieRecoveryDiagnosticScalars<IAutoMovieRecoverySqpReport> | null;

  /** Whole-fit11-field path/outcome marginals and selector visits; no path-by-outcome table or selected-path labels. lastFailure can predate later progress. */
  trials: AutoMovieRecoveryDiagnosticScalars<IAutoMovieRecoveryFeasibleTrials>;
}
