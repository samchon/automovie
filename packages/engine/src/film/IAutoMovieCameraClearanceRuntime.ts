/** Geometry-revision and fixed-clock authority supplied by the builder. */
export interface IAutoMovieCameraClearanceRuntime {
  /** Revision from which staged models were materialized. */
  revision: string;
  /** Revision still current at the performance gate. */
  currentRevision: string;
  /** Fixed-clock inspection samples per second. */
  sampleRate: number;
}
