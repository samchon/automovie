import type { IAutoMovieMotionHumanFirearm } from "@automovie/interface";

/**
 * The draw preset: the holstered firearm taken by its grip and lifted 0.15 m clear, its bore continuing the forearm. The `draw` row of `HumanWeaponFirearm` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanFirearm.IDrawPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFirearm.DRAW`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FIREARM_DRAW: IAutoMovieMotionHumanFirearm.IDrawPreset = {
  handle: "grip",
  lift: 0.15,
  use: { tip: "muzzle", line: "forearm" },
};
