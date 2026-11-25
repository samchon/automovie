/**
 * Retain one source-free ordinary open run's actual generation and
 * qualification. Counts describe emitted geometry independently of source fit
 * and completion.
 */
export interface IAutoMovieRecoveryLocalRunReport {
  /** Stable generated run identity. */
  id: string;

  /** First saved section ordinal. */
  firstSection: number;

  /** Last saved section ordinal. */
  lastSection: number;

  /** Ordered original saved coefficient names. */
  curves: string[];

  /** Whether at least one triangle was emitted. */
  generated: boolean;

  /** Actual limitation or failure text; null means none observed. */
  reason: string | null;

  /** Planned adjacent saved pairs. */
  intervals: number;

  /** Engine-reported omitted intervals. */
  omittedIntervals: number;

  /** Newly emitted render vertices. */
  vertices: number;

  /** Newly emitted render triangles. */
  triangles: number;

  /** Courses without the declared material orientation witness. */
  unqualifiedSourceOrientations: number;

  /** Saved course fits that missed their original positional request. */
  fitTargetMisses: number;

  /** Courses whose saved fit flag or finite nonnegative estimate is unavailable. */
  unqualifiedFitMetadata: number;

  /**
   * Maximum saved curve-to-observed-polyline upper estimate in millimetres, or
   * null when any estimate is unavailable.
   */
  fitPolylineUpperEstimateMaximumMm: number | null;
}
