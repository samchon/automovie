import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { walkLeg } from "./walkLeg";

/**
 * Keep the forefoot on its authored path as the heel rises within the ankle's range.
 *
 * @param body The performer's foot surface and measured leg segments.
 * @param posture The lowered, balanced posture with the stepping leg's ankle goal.
 * @param side The foot taking the step.
 * @param read The current posture's FK workspace.
 * @param dorsal Available ankle dorsiflexion in degrees. Defaults to the unloaded limit.
 * @returns The posture with a ranged heel and reciprocal toe extension.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed forefoot, changing heel, ankle limit in degrees and actual lowered posture.
 * @evidence contracts/development/implementation.md#principled-implementation Solves the available ankle angle about the authored metatarsal contact against the current hip position and preserves the forefoot attitude by the opposite toe rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the one moving foot and hip, finds the existing rocker solution and writes the two affected joint demands.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original contact, heading, body measurements, current hip and supplied load-dependent range.
 * @evidence contracts/development/implementation.md#efficient-algorithms One hip read and one bounded one-dimensional rocker solve for the active foot. A foot already inside its range returns the input posture.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses hipJoints, walkLeg.heelRise and HumanFoot.pivot for the same ankle geometry in a brace and jump push-off.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources All temporary geometry is local to this evaluation.
 */
export function rangeSteppingFoot(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  dorsal?: number,
): IAutoMovieMotionHumanPosture {
  const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
  const placement: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: goal.point,
    rotation: goal.rotation!,
  };
  const hip: IAutoMovieVector3 = hipJoints(
    body, posture.root, resolveHumanPosture.heading(posture), posture.joints.hips, read(),
  )[side];
  const direction: ReturnType<typeof HumanFoot.headingPitch> = HumanFoot.headingPitch(placement.rotation);
  const forefoot: IAutoMovieVector3 = HumanFoot.point(body, side, "mtp", placement);
  const pitch: number = walkLeg.heelRise(
    body, side, hip, forefoot, direction.heading, direction.pitch, walkLeg.ROCKER, dorsal,
  );
  if (pitch === direction.pitch) return posture;
  const foot: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body, side, "mtp", forefoot, direction.heading, pitch, 0, HumanFoot.roll(placement.rotation),
  );
  const toes: readonly [number, number, number] = posture.joints[`${side}Toes`] ?? [0, 0, 0];
  return {
    ...posture,
    joints: { ...posture.joints, [`${side}Toes`]: [toes[0] + direction.pitch - pitch, toes[1], toes[2]] },
    limbs: { ...posture.limbs, [`${side}Leg`]: { ...goal, point: foot.ankle, rotation: foot.rotation } },
  };
}
