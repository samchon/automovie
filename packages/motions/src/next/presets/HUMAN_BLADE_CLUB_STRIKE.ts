import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The club strike preset: a club or a baton brought down from above, its
 * striking contact the tip. The `clubStrike` row of `HumanWeaponMelee` reads
 * it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanBlade.IClubPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanBlade.CLUB_STRIKE`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_BLADE_CLUB_STRIKE: IAutoMovieMotionHumanBlade.IClubPreset = {
  from: "above",
  tip: "strike",
};
