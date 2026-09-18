import { IAutoMovieIKPole } from "./IAutoMovieIKPole";

/**
 * Inverse kinematics: back-solve a bone chain so its tip reaches a goal.
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieIKDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieIKDriver` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieIKDriver {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `type` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `type` for the performance motion clip keytime interpolation system contract.
   */
  type: "ik";
  /**
   * Bone chain, root → tip.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `chain` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `chain` for the performance motion clip keytime interpolation system contract.
   */
  chain: string[];
  /**
   * Node the chain tip reaches for.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `goal` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `goal` for the performance motion clip keytime interpolation system contract.
   */
  goal: string;
  /**
   * Pole/twist control for the solve plane, or `null`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `pole` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `pole` for the performance motion clip keytime interpolation system contract.
   */
  pole: IAutoMovieIKPole | null;
  /**
   * Solver. `twoBone` is the analytic, deterministic limb solver (build-first);
   * `ccd`/`fabrik` are iterative, for longer chains.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `solver` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `solver` for the performance motion clip keytime interpolation system contract.
   */
  solver: "twoBone" | "ccd" | "fabrik";
  /**
   * Iteration cap for iterative solvers (fixed for determinism); `null` for
   * `twoBone`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `iterations` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `iterations` for the performance motion clip keytime interpolation system contract.
   */
  iterations: number | null;
  /**
   * Blend factor `[0, 1]`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `influence` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `influence` for the performance motion clip keytime interpolation system contract.
   */
  influence: number;
}
