import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The front kick preset: a push kick of the lead leg. The `frontKick` row of
 * `HumanDrill` reads it, so the row and the preset share one value.
 */
export const HUMAN_MILITARY_DRILL_FRONT_KICK: IAutoMovieMotionHumanMilitaryDrill.IKickPreset =
  { technique: "push", leg: "lead" };
