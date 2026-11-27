import type {
  IAutoMovieCompileSweepGuideOutput,
  IAutoMovieSweep,
} from "@automovie/interface";

import { compileAutoMovieSweepProfile } from "./compileAutoMovieSweepProfile";

/*
 * Compile one silhouette guide's angle and positive radius profile.
 * Parameter guide: Authored guide, read without mutation
 * Parameter index: Its index for refusal diagnostics
 * Returns: A wrapped angle and compiled positive finite radius query
 * Error for a non-finite angle or an invalid profile or profile query
 */
export function compileAutoMovieSweepGuide(
  guide: IAutoMovieSweep.IGuide,
  index: number,
): IAutoMovieCompileSweepGuideOutput {
  return {
    angle: ((guide.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    radius: compileAutoMovieSweepProfile(guide.radii, `sweep guide ${index}`),
  };
}
