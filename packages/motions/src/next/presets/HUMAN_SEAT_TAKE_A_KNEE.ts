import type { IAutoMovieMotionHumanSeat } from "@automovie/interface";

/**
 * The takeAKnee preset of `kneel`: Kneeling on one knee and staying three seconds without rising (provisional). Spread into `kneel`'s parameters; the `takeAKnee` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The kneel law's own members as one `IKneelPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanSeat.TAKE_A_KNEE`; the `takeAKnee` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_SEAT_TAKE_A_KNEE: IAutoMovieMotionHumanSeat.IKneelPreset = {
  hold: 3,
  rise: false,
};
