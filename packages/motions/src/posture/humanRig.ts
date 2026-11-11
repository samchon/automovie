import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMoviePoseRig,
} from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * The rig a body's poses are read through: its skeleton with the canonical
 * joint axes and rest frames, the reading `poseBones` and the limb fits use,
 * so a pose differenced or blended as rotations (a transition's velocity and
 * its decaying offset) is the pose that is displayed.
 *
 * @param body The body.
 * @returns Its rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the rig is and why it matches the display.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's canonical humanoid axes and rest frames with the body's own skeleton.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of the rig value in motions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cast or copy; the tables are the engine's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function humanRig(body: IHumanBody): IAutoMoviePoseRig {
  return {
    skeleton: body.skeleton,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  };
}
