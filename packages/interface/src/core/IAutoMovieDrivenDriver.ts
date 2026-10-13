import { IAutoMovieChannel } from "./IAutoMovieChannel";
import { IAutoMovieDrivenCurve } from "./IAutoMovieDrivenCurve";

/**
 * A driven relationship: one scalar channel computed from another (the
 * driven-key / range-map / mimic-joint archetype). A finger-curl slider driving
 * three phalanx joints is three drivers reading the same source.
 *
 * The default mapping is a linear range remap (`inRange` to `outRange`). Real
 * rigs, though, often need a nonlinear coupling: a finger that curls slowly
 * then snaps, or a corrective shape that only kicks in past a threshold. Supply
 * `curve` for that: named source/output control points, piecewise-linear
 * between them, the ends held. When present it supersedes
 * `inRange`/`outRange`/`clamp`.
 *
 * Resolved in the channel-space pass before limits clamp, in dependency order
 * with copy drivers. `output` must be scalar-width: a pointer whose `valueType`
 * is `scalar`, or a node's `weights` holding one morph value; a node TRS output
 * or multi-morph weights throw. `source` must sample to exactly one value. When
 * the source channel was not sampled this frame, the linear map reads
 * `inRange[0]` and the curve its first point. Equal `inRange` ends map every
 * source to `outRange[0]`. A pointer output stays inside the frame:
 * `resolveFrame` returns node matrices and weights only, so a later driver or a
 * limit violation is the only place that value shows.
 *
 * @author Samchon
 */
export interface IAutoMovieDrivenDriver {
  /** Discriminator. */
  type: "driven";

  /** Scalar-width channel that receives the computed value. */
  output: IAutoMovieChannel;

  /** Channel read as the driver value; it must hold exactly one value. */
  source: IAutoMovieChannel;

  /**
   * Source value range `[in0, in1]` mapped onto `outRange` (linear default).
   * Required for the linear remap; **omit when `curve` is set**: the curve
   * supersedes it, so a nonlinear driver need not invent a dead range.
   */
  inRange?: [number, number];

  /**
   * Output value range `[out0, out1]`. Linear remap only; omit with `curve`.
   */
  outRange?: [number, number];

  /**
   * Clamp the linear output to `outRange` outside `inRange`. Linear only; omit
   * with `curve` (and, when omitted on a linear driver, defaults to no clamp).
   */
  clamp?: boolean;

  /**
   * Optional nonlinear map: source/output control points sorted by source
   * value, with output interpolated piecewise-linearly between them and held
   * flat beyond the first/last point. When set it replaces the linear
   * `inRange`/`outRange` remap. `null` / omitted keeps the straight-line
   * default.
   */
  curve?: IAutoMovieDrivenCurve | null;
}
