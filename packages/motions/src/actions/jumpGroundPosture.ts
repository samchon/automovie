import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanFoot } from "../posture/HumanFoot";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { walkLeg } from "./walkLeg";

/**
 * Fit the reaching foot during push-off and clear the arms against the bent legs.
 *
 * @param body The jumping body's limb lengths and collision geometry.
 * @param posture The ground phase's actual lowered posture and world goals.
 * @param phase The reaching side during push-off, or the two-foot landing.
 * @param read The operation's FK reader, shared with lowering and fitting.
 * @returns Corrected ground-phase demands for both endpoint construction and playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the lowered frame, phase and consumers of the corrected demands.
 * @evidence contracts/development/implementation.md#principled-implementation A withdrawing foot rotates about its planned forefoot as the lowered hip bends its shank. Each arm clears the actual flexed thighs during both the push and the landing at the least shoulder abduction the shared clearance owner finds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The landing delegates joint-space clearance; the reaching leg uses the existing ankle rocker, rigid forefoot pivot and reciprocal toe flexion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the current pose, actual body, original support foot and authored forefoot path; the same demands enter the ballistic endpoint and ground playback.
 * @evidence contracts/development/implementation.md#efficient-algorithms Push needs a hip read and one bounded rocker solve; landing uses the existing posed-arm clearance solve.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Playback and both endpoints call this same geometry after lowering and borrow their current operation's FK reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the posture and stores no samples, workspace or handles.
 */
export function jumpGroundPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  phase: "left" | "right" | "landing",
  read: ReturnType<typeof prepareHumanPoseResolution>,
): IAutoMovieMotionHumanPosture {
  const lowered: IAutoMovieMotionHumanPosture = phase === "landing" ? posture : reachingFoot(body, posture, phase, read);
  return HumanArmClearance.swung(body, lowered, ["left", "right"], read);
}

/** Keep the withdrawing forefoot on its planned path while its heel rises with the unloaded shank. */
function reachingFoot(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture,
  phase: "left" | "right", read: ReturnType<typeof prepareHumanPoseResolution>): IAutoMovieMotionHumanPosture {
  const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${phase}Leg`]!;
  const placement: IAutoMovieMotionHumanFoot.IPlacement = { ankle: goal.point, rotation: goal.rotation! };
  const hip: IAutoMovieVector3 = hipJoints(body, posture.root, resolveHumanPosture.heading(posture),
    posture.joints.hips, read())[phase];
  const direction: ReturnType<typeof HumanFoot.headingPitch> = HumanFoot.headingPitch(placement.rotation);
  const forefoot: IAutoMovieVector3 = HumanFoot.point(body, phase, "mtp", placement);
  const pitch: number = walkLeg.heelRise(body, phase, hip, forefoot, direction.heading, direction.pitch, walkLeg.ROCKER);
  if (pitch === direction.pitch) return posture;
  const foot: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(body, phase, "mtp", forefoot,
    direction.heading, pitch, 0, HumanFoot.roll(placement.rotation));
  const toes: readonly [number, number, number] = posture.joints[`${phase}Toes`] ?? [0, 0, 0];
  return {
    ...posture,
    joints: { ...posture.joints, [`${phase}Toes`]: [toes[0] + direction.pitch - pitch, toes[1], toes[2]] },
    limbs: { ...posture.limbs, [`${phase}Leg`]: { ...goal, point: foot.ankle, rotation: foot.rotation } },
  };
}
