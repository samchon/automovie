import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/*
 * The cover vent preset: the fingertips held on the gun's vent. The `coverVent`
 * row of `HumanGunDrill` reads it, so the row and the preset share one value.
 */
export const HUMAN_MILITARY_DRILL_COVER_VENT: IAutoMovieMotionHumanMilitaryDrill.ICoverVentPreset =
  { effector: "fingertips", kind: "hold" };
