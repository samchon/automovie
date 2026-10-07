import type { IAutoMovieMotion } from "@automovie/interface";

import { createFilmVisualReadTransform } from "./createFilmVisualReadTransform";
import { keyframe, makeMotion, makePose } from "./fixtures";

/** Build the existing stationary actor root at its authored world coordinates. */
export const createFilmVisualReadRootMotion = (
  id: string,
  x: number,
  y: number,
  z: number,
): IAutoMovieMotion => ({
  ...makeMotion(
    [
      keyframe(0, makePose([], createFilmVisualReadTransform(x, y, z))),
      keyframe(1, makePose([], createFilmVisualReadTransform(x, y, z))),
    ],
    1,
  ),
  id,
});
