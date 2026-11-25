import type { IAutoMovieMotionHumanArchery } from "@automovie/interface";

/**
 * The throw knife preset: a knife thrown overarm and spinning whole half turns
 * over the flight to the target. The `throwKnife` row of `HumanThrownWeapon`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_ARCHERY_THROW_KNIFE: IAutoMovieMotionHumanArchery.IKnifePreset =
  { style: "overarm", attitude: { kind: "turns" } };
