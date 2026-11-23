import type { IAutoMovieMotionHumanSeat } from "@automovie/interface";

/**
 * The kneelSit preset of `kneel`: Sitting back on the heels from both knees and
 * staying three seconds (provisional). Spread into `kneel`'s parameters; the
 * `kneelSit` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The kneel law's own members as one `IKneelPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanSeat.KNEEL_SIT`; the `kneelSit` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_SEAT_KNEEL_SIT: IAutoMovieMotionHumanSeat.IKneelPreset = {
  kind: "sitBack",
  hold: 3,
  rise: false,
};
