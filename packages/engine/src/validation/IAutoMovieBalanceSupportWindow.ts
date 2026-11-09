import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declare a sampled stance interval and explicit support bones for projected balance checks.
 *
 * @evidence contracts/development/design.md#principled-representation The validator samples resolved joints, forms the horizontal support hull and tests a joint-mass-weighted COM proxy or the selected center bone against a metre margin; the default proxy is not a measured distributed-body COM.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action-level contacts remain authored instead of being guessed from a generic rig or motion label.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Discrete sampling does not certify continuous balance between frames, and any declared physicsIntent suppresses balance warnings; malformed windows are separately reported as errors.
 * @evidence contracts/development/common.md#meaningful-documentation Documents seconds, metre margin default 0.02, explicit contacts and the approximation behind the default center source.
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
