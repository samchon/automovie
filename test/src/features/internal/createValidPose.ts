import { IAutoMoviePose } from "@automovie/interface";

import { joint } from "./joint";
import { makePose } from "./makePose";

/**
 * Create the existing three-joint engine test pose with authored left arm/elbow/upper-leg angles within its default ROM. This sample is a conventional test input, not a measured clinical posture.
 */
export function createValidPose(): IAutoMoviePose {
  return makePose([
    joint("leftUpperArm", { flexion: 30, abduction: 45 }),
    joint("leftLowerArm", { flexion: 90 }),
    joint("leftUpperLeg", { flexion: 40 }),
  ]);
}
