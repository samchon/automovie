import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Orient an owner so one of its axes points at a target (eyes, head, camera).
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieAimDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieAimDriver` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieAimDriver {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `type` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `type` for the performance motion clip keytime interpolation system contract.
   */
  type: "aim";
  /**
   * Node to orient.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `owner` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `owner` for the performance motion clip keytime interpolation system contract.
   */
  owner: string;
  /**
   * Node to point at.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `target` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `target` for the performance motion clip keytime interpolation system contract.
   */
  target: string;
  /**
   * Owner-local axis aimed at the target (e.g. camera `(0,0,-1)`).
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `aimAxis` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `aimAxis` for the performance motion clip keytime interpolation system contract.
   */
  aimAxis: IAutoMovieVector3;
  /**
   * Owner-local up axis, kept aligned to `worldUp` to fix the remaining roll.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `upAxis` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `upAxis` for the performance motion clip keytime interpolation system contract.
   */
  upAxis: IAutoMovieVector3;
  /**
   * World reference up the `upAxis` aligns to.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `worldUp` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `worldUp` for the performance motion clip keytime interpolation system contract.
   */
  worldUp: IAutoMovieVector3;
  /**
   * Blend factor `[0, 1]`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `influence` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `influence` for the performance motion clip keytime interpolation system contract.
   */
  influence: number;
}
