import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Declared balance window for center-of-mass support validation.
 *
 * The support hull is explicit because stance semantics are action-level facts:
 * a jump, kneel, hand plant, or one-foot balance all need different contact
 * points even when the same skeleton is sampled.
 *
 * @author Samchon
 */
export interface IAutoMovieBalanceSupportWindow {
  /**
   * Center-of-mass source. **Omit** (the default and recommended form) to use
   * the segment-mass-weighted whole-body COM over the resolved pose,
   * trustworthy for a lean, reach, or crouch, where the real COM shifts far
   * from the pelvis. Provide a bone to override with a single-bone proxy (the
   * pre-#1184 coarse behavior) for a rig or stance where a specific point is
   * the intended COM.
   */
  centerBone?: AutoMovieHumanoidBone;

  /** Ordered support contact bones projected onto the horizontal XZ plane. */
  supportBones: readonly AutoMovieHumanoidBone[];

  /** Inclusive start time in seconds. */
  start: number;

  /** Inclusive end time in seconds. */
  end: number;

  /** Allowed projected COM distance outside the support hull in meters. */
  margin?: number;
}
