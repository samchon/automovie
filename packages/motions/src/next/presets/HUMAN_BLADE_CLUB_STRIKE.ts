import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The club strike preset: a club or a baton brought down from above, its
 * striking contact the tip. The `clubStrike` row of `HumanWeaponMelee` reads
 * it, so the row and the preset share one value.
 */
export const HUMAN_BLADE_CLUB_STRIKE: IAutoMovieMotionHumanBlade.IClubPreset = {
  from: "above",
  tip: "strike",
};
