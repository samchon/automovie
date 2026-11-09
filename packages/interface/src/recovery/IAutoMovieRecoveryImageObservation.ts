import type { IAutoMovieRecoveryImageObservationView } from "./IAutoMovieRecoveryImageObservationView";

/**
 * Recorded foreground support intervals in supplied camera charts.
 * Row support is a silhouette envelope, never a persistent material-edge track.
 * The initial family requires one opaque interval per occupied row and one
 * eight-connected component; holes, disconnected support, clipped foreground
 * and missing interior rows refuse.
 *
 * @evidence contracts/development/design.md#principled-representation Physical Y rows retain measured support limits, view charts and half-pixel quantization needed by inverse section fitting.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Dense observations remain separate from compact generation coefficients and qualification reports.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No interpolated source mesh, manually associated silhouette points or unobserved cap is a measurement.
 * @evidence contracts/development/common.md#meaningful-documentation States millimetres, support rather than material correspondence, supplied-camera provenance and quantization limits.
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
