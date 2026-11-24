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
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { walkLeg } from "./walkLeg";

/**
 * Keep the forefoot on its authored path as the heel rises within the ankle's
 * range.
 *
 * @param body The performer's foot surface and measured leg segments.
 * @param posture The lowered, balanced posture with the stepping leg's ankle
 *   goal.
 * @param side The foot taking the step.
 * @param read The current posture's FK workspace.
 * @param dorsal Available ankle dorsiflexion in degrees. Defaults to the
 *   unloaded limit.
 * @returns The posture with a ranged heel and reciprocal toe extension.
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
    body,
    posture.root,
    humanPostureHeading(posture),
    posture.joints.hips,
    read(),
  )[side];
  const direction: ReturnType<typeof HumanFoot.headingPitch> =
    HumanFoot.headingPitch(placement.rotation);
  const forefoot: IAutoMovieVector3 = HumanFoot.point(
    body,
    side,
    "mtp",
    placement,
  );
  const pitch: number = walkLeg.heelRise(
    body,
    side,
    hip,
    forefoot,
    direction.heading,
    direction.pitch,
    walkLeg.ROCKER,
    dorsal,
  );
  if (pitch === direction.pitch) return posture;
  const foot: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    body,
    side,
    "mtp",
    forefoot,
    direction.heading,
    pitch,
    0,
    HumanFoot.roll(placement.rotation),
  );
  const toes: readonly [number, number, number] = posture.joints[
    `${side}Toes`
  ] ?? [0, 0, 0];
  return {
    ...posture,
    joints: {
      ...posture.joints,
      [`${side}Toes`]: [toes[0] + direction.pitch - pitch, toes[1], toes[2]],
    },
    limbs: {
      ...posture.limbs,
      [`${side}Leg`]: { ...goal, point: foot.ankle, rotation: foot.rotation },
    },
  };
}
