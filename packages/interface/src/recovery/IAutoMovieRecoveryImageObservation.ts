import type { IAutoMovieRecoveryImageInput } from "./IAutoMovieRecoveryImageInput";

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
  /** Versioned silhouette-support schema. */
  schema: "automovie-recovery-image-support-v1";

  /** Same fixed-object capture identity. */
  objectId: string;

  /** Common supplied right-handed metric-frame identity. */
  frame: string;

  /** Acquisition cohort remains separate through fitting and evaluation. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Automatically applied foreground method. */
  method: "fixed-background-channel-distance-v1";

  /** Fixed-image and supplied-camera provenance per view. */
  views: (Pick<
    IAutoMovieRecoveryImageInput["views"][number],
    "id" | "sourceSha256" | "pixelProvenance" | "width" | "height" | "camera"
  > & {
    /** Pixel-cell limits at row-centre Y, in increasing Y order. */
    rows: { yMm: number; lowerMm: number; upperMm: number }[];
    /** Half the pitch, covering ideal quantization rather than unknown segmentation or calibration errors. */
    quantizationMm: number;
  })[];
}
