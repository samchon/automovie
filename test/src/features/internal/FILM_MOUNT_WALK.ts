import type { IAutoMovieMotion } from "@automovie/interface";

import { keyframe, makeMotion, makePose } from "./fixtures";

/**
 * The mount unit's two-second zero-to-two-metre X root motion with identity orientation and scale, built from the existing canonical pose helpers. The owning entry observes rider movement, shared-FK handoff and beat-end velocity; this fixture supplies a deterministic input rather than an independent FK oracle and starts no host.
 */
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
