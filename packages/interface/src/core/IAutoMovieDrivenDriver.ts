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
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieDrivenDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieDrivenDriver` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieDrivenDriver {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `type` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `type` for the performance motion clip keytime interpolation system contract.
   */
  type: "driven";

  /**
   * Channel that receives the computed value.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `output` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `output` for the performance motion clip keytime interpolation system contract.
   */
  output: IAutoMovieChannel;

  /**
   * Channel read as the driver value.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `source` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `source` for the performance motion clip keytime interpolation system contract.
   */
  source: IAutoMovieChannel;

  /**
   * Source value range `[in0, in1]` mapped onto `outRange` (linear default).
   * Required for the linear remap; **omit when `curve` is set**: the curve
   * supersedes it, so a nonlinear driver need not invent a dead range.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `inRange` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `inRange` for the performance motion clip keytime interpolation system contract.
   */
  inRange?: [number, number];

  /**
   * Output value range `[out0, out1]`. Linear remap only; omit with `curve`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `outRange` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `outRange` for the performance motion clip keytime interpolation system contract.
   */
  outRange?: [number, number];

  /**
   * Clamp the linear output to `outRange` outside `inRange`. Linear only; omit
   * with `curve` (and, when omitted on a linear driver, defaults to no clamp).
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `clamp` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `clamp` for the performance motion clip keytime interpolation system contract.
   */
  clamp?: boolean;

  /**
   * Optional nonlinear map: source/output control points sorted by source
   * value, with output interpolated piecewise-linearly between them and held
   * flat beyond the first/last point. When set it replaces the linear
   * `inRange`/`outRange` remap. `null` / omitted keeps the straight-line
   * default.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `curve` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `curve` for the performance motion clip keytime interpolation system contract.
   */
  curve?: IAutoMovieDrivenCurve | null;
}
