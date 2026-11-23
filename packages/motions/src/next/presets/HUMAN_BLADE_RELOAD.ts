import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The reload preset: the support hand's palm pressed once at the place the composition names (the pistol's `magazine` contact). The `reload` row of `HumanWeaponMelee` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanBlade.IReloadPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanBlade.RELOAD`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_BLADE_RELOAD: IAutoMovieMotionHumanBlade.IReloadPreset = {
  effector: "palm",
  kind: "press",
  count: 1,
  hand: "left",
};
