import { IAutoMovieChannel } from "./IAutoMovieChannel";
import { IAutoMovieDrivenCurve } from "./IAutoMovieDrivenCurve";

/**
 * A driven relationship: one scalar channel computed from another (the
 * driven-key, range-map or mimic-joint archetype). A finger-curl slider
 * driving three phalanx joints is three drivers reading the same source.
 *
 * The default mapping is a linear range remap (`inRange` to `outRange`). Real
 * rigs often need a nonlinear coupling instead: a finger that curls slowly then
 * snaps, or a corrective shape that only kicks in past a threshold. Supply
 * `curve` for that: source and output control points, piecewise-linear between
 * them, the ends held. When present it supersedes `inRange`, `outRange` and
 * `clamp`; without it, both ranges are required and their absence throws.
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
 * @evidence contracts/common.md#principled-implementation `applyDriven` checks the output is scalar-width, reads the source as exactly one finite value, then evaluates the curve or the affine remap `o0 + (o1 - o0) * t` with `t = (x - i0) / (i1 - i0)` (zero when the ends are equal), clamping `t` to `[0, 1]` only when `clamp` is true.
 * @evidence contracts/common.md#clear-and-simple-design One driver type covers both mappings, with the curve as an optional field that replaces the range triple, so a nonlinear driver need not invent a dead range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A TRS output is refused because a width-1 write would NaN-poison the composed matrices, multi-morph weights are refused rather than narrowed, and a missing range throws rather than defaulting to identity.
 * @evidence contracts/common.md#meaningful-documentation States both mappings and when each applies, the pass and ordering, the exact output and source width rules, the answer for an unsampled source and for equal range ends, the clamp default, and where a pointer output becomes visible.
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
   * Finite source range `[in0, in1]` mapped onto `outRange`. Required for the
   * linear remap; omit it when `curve` is set, because the curve supersedes
   * it.
   */
  inRange?: [number, number];

  /**
   * Finite output range `[out0, out1]`. Linear remap only; omit it with
   * `curve`.
   */
  outRange?: [number, number];

  /**
   * Whether the linear output is clamped to `outRange` outside `inRange`.
   * Linear only; omit it with `curve`. Omitted on a linear driver means no
   * clamp.
   */
  clamp?: boolean;

  /**
   * Optional nonlinear map: source and output control points sorted by source
   * value, with output interpolated piecewise-linearly between them and held
   * flat beyond the first and last point. When set it replaces the linear
   * `inRange` and `outRange` remap; `null` or omitted keeps the straight-line
   * default.
   */
  curve?: IAutoMovieDrivenCurve | null;
}
