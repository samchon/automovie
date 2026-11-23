import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The squatSit preset of `crouch`: Squatting fully, the heels up, and holding
 * three seconds (provisional). Spread into `crouch`'s parameters; the
 * `squatSit` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The crouch law's own members as one `ICrouchPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStance.SQUAT_SIT`; the `squatSit` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STANCE_SQUAT_SIT: IAutoMovieMotionHumanStance.ICrouchPreset =
  {
    depth: "full",
    heels: "up",
    hold: 3,
  };
