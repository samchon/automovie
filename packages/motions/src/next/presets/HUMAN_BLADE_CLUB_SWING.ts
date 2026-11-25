import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The club swing preset: a club or a bat swung level from the blade hand's
 * side, its striking contact the tip. The `clubSwing` row of `HumanWeaponMelee`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_BLADE_CLUB_SWING: IAutoMovieMotionHumanBlade.IClubPreset = {
  from: "forehand",
  tip: "strike",
};
