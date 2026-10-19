/**
 * Retain one source-free ordinary open run's actual generation and qualification.
 * Counts describe emitted geometry independently of source fit and completion.
 *
 * @evidence contracts/common.md#principled-implementation Saved curve names and section ordinals identify the supplied run; actual emitted counts and failure records retain its processing outcome.
 * @evidence contracts/common.md#clear-and-simple-design One record is shared by reconstruction, publication and persisted frontier metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The report carries no source topology, fallback geometry or inferred material correspondence.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish generation, local refusal, orientation qualification and millimetre curve-fit estimates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A structural record performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The generating caller owns report updates and serialization.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns strings and scalar counts; the record retains no mesh buffers or handles.
 * @author Samchon
 */
export interface RecoveryLocalRunReport {
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

  /** Maximum saved curve-to-observed-polyline upper estimate, millimetres. */
  fitPolylineUpperEstimateMaximumMm: number;
}
