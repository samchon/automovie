import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";

/**
 * Read actual gaze frames through one immutable body/name-demand preparation.
 *
 * @param body The unchanged canonical body owning its genuine FK producer.
 * @param posture The current raw authored posture, retaining whole-body root
 *   rotation.
 * @param mode The existing direction, cervical-rest or eye-solving name set.
 * @param joints Current ordered authored override, or the posture's ordinary
 *   joints.
 * @param resolution Exact FK workspace borrowed only for this synchronous
 *   observation.
 * @returns Fresh demanded maps/frames after every current joint receives
 *   ordinary ordered admission.
 */
export function readHumanGazeBones(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  mode: Mode,
  joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  let known:
    | Partial<Record<Mode, ReturnType<typeof HumanTrunk.prepareResolve>>>
    | undefined = READERS.get(body);
  if (known === undefined) {
    known = {};
    READERS.set(body, known);
  }
  let read: ReturnType<typeof HumanTrunk.prepareResolve> | undefined =
    known[mode];
  if (read === undefined) {
    read = HumanTrunk.prepareResolve(body, NAMES[mode]);
    known[mode] = read;
  }
  return read(posture, resolution, joints);
}

/** Existing gaze observations; each set names only the actual returned frames. */
type Mode = "direction" | "head" | "eyes";

/** Fixed immutable rig-demand metadata; no posed/query answer belongs here. */
const READERS: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<Record<Mode, ReturnType<typeof HumanTrunk.prepareResolve>>>
> = new WeakMap();

/** Original eye-midpoint, cervical-rest and final-eye frame demands. */
const NAMES: Readonly<Record<Mode, ReadonlySet<AutoMovieHumanoidBone>>> = {
  direction: new Set<AutoMovieHumanoidBone>(["hips", "leftEye", "rightEye"]),
  head: new Set<AutoMovieHumanoidBone>(["hips", "head"]),
  eyes: new Set<AutoMovieHumanoidBone>(["head", "leftEye", "rightEye"]),
};
