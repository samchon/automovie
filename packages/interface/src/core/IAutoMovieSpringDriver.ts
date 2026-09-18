import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Secondary spring dynamics (hair, skirt, tail): the engine's archetype
 * integrated-but-deterministic driver, modelled on VRM SpringBone and stepped
 * with Verlet integration at the fixed timestep, so it replays identically.
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieSpringDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieSpringDriver` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieSpringDriver {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `type` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `type` for the performance motion clip keytime interpolation system contract.
   */
  type: "spring";
  /**
   * Joint chain, root → tip, whose rotations the spring writes.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `chain` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `chain` for the performance motion clip keytime interpolation system contract.
   */
  chain: string[];
  /**
   * Restoring force toward the rest pose.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `stiffness` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `stiffness` for the performance motion clip keytime interpolation system contract.
   */
  stiffness: number;
  /**
   * Damping `[0, 1]`; inertia is scaled by `(1 - drag)`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `drag` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `drag` for the performance motion clip keytime interpolation system contract.
   */
  drag: number;
  /**
   * Gravity magnitude per step.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `gravityPower` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `gravityPower` for the performance motion clip keytime interpolation system contract.
   */
  gravityPower: number;
  /**
   * Gravity direction (unit).
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `gravityDir` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `gravityDir` for the performance motion clip keytime interpolation system contract.
   */
  gravityDir: IAutoMovieVector3;
  /**
   * Collision sphere radius of the joints, meters.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `hitRadius` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `hitRadius` for the performance motion clip keytime interpolation system contract.
   */
  hitRadius: number;
  /**
   * Reference node in whose frame inertia is evaluated (so the chain ignores
   * body locomotion while gravity stays world-space), or `null`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `center` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `center` for the performance motion clip keytime interpolation system contract.
   */
  center: string | null;
}
