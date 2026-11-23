import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The takeCover preset of `crouch`: Crouching and holding two seconds
 * (provisional). Spread into `crouch`'s parameters; the `takeCover` row reads
 * it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The crouch law's own members as one `ICrouchPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStance.TAKE_COVER`; the `takeCover` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STANCE_TAKE_COVER: IAutoMovieMotionHumanStance.ICrouchPreset =
  {
    hold: 2,
  };
