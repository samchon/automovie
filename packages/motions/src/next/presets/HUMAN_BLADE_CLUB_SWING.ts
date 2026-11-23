import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The club swing preset: a club or a bat swung level from the blade hand's side, its striking contact the tip. The `clubSwing` row of `HumanWeaponMelee` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanBlade.IClubPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanBlade.CLUB_SWING`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_BLADE_CLUB_SWING: IAutoMovieMotionHumanBlade.IClubPreset = {
  from: "forehand",
  tip: "strike",
};
