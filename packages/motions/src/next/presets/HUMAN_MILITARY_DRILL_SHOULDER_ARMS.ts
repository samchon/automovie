import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/*
 * The shoulder arms preset: the musket presented at the shoulder carriage in
 * the left hand, one hand on it. The `shoulderArms` row of `HumanMusketDrill`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_MILITARY_DRILL_SHOULDER_ARMS: IAutoMovieMotionHumanMilitaryDrill.IShoulderArmsPreset =
  { carriage: "shoulder", hand: "left", hands: 1 };
