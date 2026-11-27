import type {
  IAutoMovieCompileSweepGuideOutput,
  IAutoMovieSweep,
} from "@automovie/interface";

import { compileSweepProfile } from "./compileSweepProfile";

/*
 * Compile one silhouette guide's angle and positive radius profile.
 * Parameter guide: Authored guide, read without mutation
 * Parameter index: Its index for refusal diagnostics
 * Returns: A wrapped angle and compiled positive finite radius query
 * Error for a non-finite angle or an invalid profile or profile query
 */
export function compileSweepGuide(
  guide: IAutoMovieSweep.IGuide,
  index: number,
): IAutoMovieCompileSweepGuideOutput {
  return {
    angle: ((guide.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    radius: compileSweepProfile(guide.radii, `sweep guide ${index}`),
  };
}
