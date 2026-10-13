/**
 * Geometry-revision and fixed-clock authority supplied by the builder for
 * camera clearance.
 *
 * `compileCameraClearanceReports` reads it only when a hero or coverage camera
 * declares a clearance envelope. It then records a violation and emits no
 * report when this record is absent, when `sampleRate` is not finite and
 * positive, or when `revision` differs from `currentRevision`, and otherwise
 * samples the take at `sampleRate` plus every keyframe time and copies all
 * three fields into each report.
 *
 * @evidence contracts/common.md#principled-implementation Staleness is decided by exact string equality of two opaque revision tokens supplied by the owner of the geometry, and the fixed clock is a positive sample rate, so the engine never infers freshness from object identity or wall time.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, the revision the models were built from, the revision current at the gate, and the inspection clock, which is everything the clearance gate cannot know from the shot itself; the builder fills it once per shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing record, a bad rate or a revision mismatch is a violation rather than a default clock or a silent pass, and the engine does not interpret the revision strings beyond comparing them.
 * @evidence contracts/common.md#meaningful-documentation States the reader and when it reads the record, each refusal, how the sample rate is used, that the fields are copied into the reports, and for each member its meaning and unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the sampling cost is answered on `compileCameraClearanceReports`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied per shot compilation; the engine keeps no clearance answer keyed by revision, which the production builder's freshness key owns.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two strings and a number owned by the caller; the reports copy the values rather than referencing the record.
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceRuntime {
  /** Opaque geometry revision from which the staged models were materialized. */
  revision: string;

  /**
   * Opaque geometry revision still current at the performance gate; any
   * difference from `revision` refuses every clearance take.
   */
  currentRevision: string;

  /** Fixed-clock inspection samples per second, finite and above zero. */
  sampleRate: number;
}
