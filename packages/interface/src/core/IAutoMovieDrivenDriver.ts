import type { IAutoMovieChannel } from "./IAutoMovieChannel";
import type { IAutoMovieDrivenCurve } from "./IAutoMovieDrivenCurve";

/**
 * One scalar channel computed from another. Several drivers can share one
 * source to drive separate scalar outputs.
 *
 * A non-null curve selects piecewise-linear interpolation with held ends,
 * superseding inRange, outRange and clamp. Otherwise both finite two-element
 * ranges are required; clamp defaults to false, and equal input endpoints
 * select the first output endpoint.
 *
 * Channel-space execution precedes limits and follows copy/driven dependency
 * order. Output is a scalar pointer or node weights carrying one value; TRS and
 * existing multi-value weights refuse. A sampled source must contain exactly
 * one finite scalar; an unsampled source uses the first input endpoint or first
 * curve point. Pointer output stays inside the sampled map and can affect later
 * drivers or limit findings rather than appearing in resolveFrame's return
 * value.
 */
export interface IAutoMovieDrivenDriver {
  /** Discriminator. */
  type: "driven";

  /** Scalar-width channel that receives the computed value. */
  output: IAutoMovieChannel;

  /** Channel read as the driver value; it must hold exactly one value. */
  source: IAutoMovieChannel;

  /**
   * Finite source range [in0, in1], required for linear remapping and ignored
   * with a non-null curve.
   */
  inRange?: [number, number];

  /**
   * Finite output range [out0, out1], required for linear remapping and ignored
   * with a non-null curve.
   */
  outRange?: [number, number];

  /**
   * Whether linear remapping clamps its normalized input parameter to [0, 1];
   * defaults to false and is ignored with a non-null curve.
   */
  clamp?: boolean;

  /**
   * Nonlinear map with strictly increasing finite source points and held
   * endpoint outputs. A non-null curve replaces all linear-range settings; null
   * or omission selects linear remapping.
   */
  curve?: IAutoMovieDrivenCurve | null;
}
