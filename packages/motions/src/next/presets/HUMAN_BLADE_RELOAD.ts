import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The reload preset: the support hand's palm pressed once at the place the
 * composition names (the pistol's `magazine` contact). The `reload` row of
 * `HumanWeaponMelee` reads it, so the row and the preset share one value.
 */
export const HUMAN_BLADE_RELOAD: IAutoMovieMotionHumanBlade.IReloadPreset = {
  effector: "palm",
  kind: "press",
  count: 1,
  hand: "left",
};
