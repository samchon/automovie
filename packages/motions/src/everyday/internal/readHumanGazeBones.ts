import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";

/*
 * Read actual gaze frames through the body's demand of the mode's names.
 * Parameter body: The unchanged canonical body owning its genuine FK producer.
 * Parameter posture: The current raw authored posture, retaining whole-body root
 * rotation.
 * Parameter mode: The existing direction, cervical-rest or eye-solving name set.
 * Parameter joints: Current ordered authored override, or the posture's ordinary
 * joints.
 * Parameter resolution: Exact FK workspace borrowed only for this synchronous
 * observation.
 * Returns: Fresh demanded maps/frames after every current joint receives
 * ordinary ordered admission.
 */
export function readHumanGazeBones(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  mode: Mode,
  joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return HumanTrunk.prepareResolve(body, NAMES[mode])(
    posture,
    resolution,
    joints,
  );
}

/*
 * Existing gaze observations; each set names only the actual returned frames.
 */
type Mode = "direction" | "head" | "eyes";

/*
 * Original eye-midpoint, cervical-rest and final-eye frame demands.
 */
const NAMES: Readonly<Record<Mode, ReadonlySet<AutoMovieHumanoidBone>>> = {
  direction: new Set<AutoMovieHumanoidBone>(["hips", "leftEye", "rightEye"]),
  head: new Set<AutoMovieHumanoidBone>(["hips", "head"]),
  eyes: new Set<AutoMovieHumanoidBone>(["head", "leftEye", "rightEye"]),
};
