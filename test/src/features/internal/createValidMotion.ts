import { IAutoMovieMotion } from "@automovie/interface";

import { joint } from "./joint";
import { keyframe } from "./keyframe";
import { makeMotion } from "./makeMotion";
import { makePose } from "./makePose";

/**
 * Create the existing one-second two-key elbow flexion from 0 to 120 degrees for the conventional skeleton-1 fixture. Key construction uses the same shared helpers, with engine ROM/interpolation rules owning admission.
 */
export function createValidMotion(): IAutoMovieMotion {
  return makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 120 })])),
    ],
    1,
  );
}
