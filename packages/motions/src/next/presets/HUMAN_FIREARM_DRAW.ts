import type { IAutoMovieMotionHumanFirearm } from "@automovie/interface";

/*
 * The draw preset: the holstered firearm taken by its grip and lifted 0.15 m
 * clear, its bore continuing the forearm. The `draw` row of
 * `HumanWeaponFirearm` reads it, so the row and the preset share one value.
 */
export const HUMAN_FIREARM_DRAW: IAutoMovieMotionHumanFirearm.IDrawPreset = {
  handle: "grip",
  lift: 0.15,
  use: { tip: "muzzle", line: "forearm" },
};
