import type { IAutoMovieMotion } from "@automovie/interface";

import { keyframe, makeMotion, makePose } from "./fixtures";

/** Preserve the existing two-second horse root translation for the mounted scenario. */
export const FILM_MOUNT_WALK: IAutoMovieMotion = makeMotion(
  [
    keyframe(
      0,
      makePose([], {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      }),
    ),
    keyframe(
      2,
      makePose([], {
        translation: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      }),
    ),
  ],
  2,
);
