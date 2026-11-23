import type { IAutoMovieMotionHumanFirearm } from "@automovie/interface";

/**
 * The surrender preset: the hands raised and held for 2 s. The `surrender` row
 * of `HumanFirearm` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanFirearm.ISurrenderPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFirearm.SURRENDER`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FIREARM_SURRENDER: IAutoMovieMotionHumanFirearm.ISurrenderPreset =
  { kind: "cheer", hold: 2 };
