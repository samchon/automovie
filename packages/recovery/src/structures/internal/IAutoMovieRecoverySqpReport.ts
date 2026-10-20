/**
 * Latest optional working-space and curvature attempt, without a trajectory.
 *
 * @evidence contracts/common.md#principled-implementation Untilted affine-QP qualification, mixed descent and correction support are distinct from baseline QP and nonlinear normal certificates.
 * @evidence contracts/common.md#clear-and-simple-design Scalar evidence records the actual unsupported branch without retaining a fitted history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing certificate, negative dual, rejected trial or capacity refusal is relabeled as convergence.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish working coordinates, original-unit residuals, mixing and conservative visits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased report performs no fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the latest constant-size report transfers; factors and trial states are not included.
 */
export interface IAutoMovieRecoverySqpReport {
  /** Whether the complete untilted affine QP received a numerical certificate. */
  qualified: boolean;

  /** Working-space support or refusal reason, independent of nonlinear status. */
  reason: string;

  /** Positive-weight constraint rows selected from the baseline direction. */
  selectedRows: number;

  /** Exact nonzero coordinate union used in the working transpose. */
  coordinates: number;

  /** Smallest/largest original working singular value; null without a factor. */
  designRatio: number | null;

  /** Largest original physical affine inequality violation. */
  maximumViolation: number | null;

  /** Largest selected original physical equality residual. */
  equalityResidual: number | null;

  /** Largest original physical quadratic stationarity component. */
  stationarityResidual: number | null;

  /** Scale of the original physical objective gradient. */
  stationarityScale: number | null;

  /** Largest selected physical equality residual before the single refinement. */
  equalityBeforeRefinement: number | null;

  /** Whether a nonzero selected physical equality residual was corrected once. */
  refinementAttempted: boolean;

  /** Nominal coefficient min(1, physical SQP norm squared), before support work. */
  nominalMixWeight: number | null;

  /** Whether nominal mixing required the bounded original-row segment branch. */
  numericalMixAttempted: boolean;

  /** Whether that branch supplied a raw-row-qualified new physical direction. */
  numericalMixSupported: boolean;

  /** Tilted coefficient actually tried: nominal or original-row-supported. */
  mixWeight: number | null;

  /** Whether one failed full trial requested selected-constraint correction support. */
  correctionAttempted: boolean;

  /** Whether that single minimum-metric correction met its support conditions. */
  correctionSupported: boolean;

  /** Conservative visits charged before scans, factorization and correction. */
  work: number;
}
