import type { IAutoMovieMotionHumanLieDown } from "@automovie/interface";
import { lieDownPoses } from "./lieDownPoses";

/*
 * Seconds of each quarter turn (provisional).
 */
export const QUARTER: number = 1;

/*
 * The limb postures at each quarter turn, from the back over the left side.
 */
export const KEYS: readonly IAutoMovieMotionHumanLieDown.IPose[] = [
  lieDownPoses.POSES.supine,
  lieDownPoses.POSES.lateralLeft,
  lieDownPoses.POSES.prone,
  lieDownPoses.POSES.lateralRight,
];
