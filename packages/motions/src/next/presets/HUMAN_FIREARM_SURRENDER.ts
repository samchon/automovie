import type { IAutoMovieMotionHumanFirearm } from "@automovie/interface";

/**
 * The surrender preset: the hands raised and held for 2 s. The `surrender` row
 * of `HumanFirearm` reads it, so the row and the preset share one value.
 */
export const HUMAN_FIREARM_SURRENDER: IAutoMovieMotionHumanFirearm.ISurrenderPreset =
  { kind: "cheer", hold: 2 };
