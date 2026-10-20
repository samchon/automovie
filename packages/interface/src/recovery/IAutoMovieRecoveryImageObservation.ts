import type { IAutoMovieRecoveryImageObservationView } from "./IAutoMovieRecoveryImageObservationView";

/**
 * Recorded foreground support intervals in supplied camera charts.
 * Row support is a silhouette envelope, never a persistent material-edge track.
 * The initial family requires one opaque interval per occupied row and one
 * eight-connected component; holes, disconnected support, clipped foreground
 * and missing interior rows refuse.
 *
 * @evidence contracts/common.md#principled-implementation Physical Y rows retain measured support limits, view charts and half-pixel quantization needed by inverse section fitting.
 * @evidence contracts/common.md#clear-and-simple-design Dense observations remain separate from compact generation coefficients and qualification reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No interpolated source mesh, manually associated silhouette points or unobserved cap is a measurement.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, support rather than material correspondence, supplied-camera provenance and quantization limits.
 */
export interface IAutoMovieRecoveryImageObservation {
  /** Same fixed-object capture identity. */
  objectId: string;

  /** Common supplied right-handed metric-frame identity. */
  frame: string;

  /** Acquisition cohort remains separate through fitting and evaluation. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Automatically applied foreground method. */
  method: "fixed-background-channel-distance-v1";

  /** Fixed-image and supplied-camera provenance per view. */
  views: IAutoMovieRecoveryImageObservationView[];
}
