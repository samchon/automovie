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
