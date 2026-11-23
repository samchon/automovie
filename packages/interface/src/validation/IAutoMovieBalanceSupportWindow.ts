import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Declare a sampled stance interval and explicit support bones for projected
 * balance checks.
 */
export interface IAutoMovieBalanceSupportWindow {
  /**
   * Omit to use the validator's fixed segment-mass fractions at resolved joint
   * positions, renormalized over the resolved population. This is a body-center
   * proxy rather than a measured distributed-segment COM. A supplied bone
   * selects its resolved position instead.
   */
  centerBone?: AutoMovieHumanoidBone;

  /** Ordered support contact bones projected onto the horizontal XZ plane. */
  supportBones: readonly AutoMovieHumanoidBone[];

  /** Inclusive finite start time in seconds; negative starts are not refused. */
  start: number;

  /** Inclusive finite end time in seconds, strictly greater than start. */
  end: number;

  /** Finite nonnegative hull-distance margin in metres; omitted means 0.02. */
  margin?: number;
}
