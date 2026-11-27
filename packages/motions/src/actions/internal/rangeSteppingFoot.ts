import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
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
 * @param solved The pitch the rule reaches here, solved in preparation
 *   (`rangeSteppingFoot.pitch`); searched here when absent.
 * @returns The posture with a ranged heel and reciprocal toe extension.
 */
export function rangeSteppingFoot(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  dorsal?: number,
  solved?: number,
): IAutoMovieMotionHumanPosture {
  const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
  const placement: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: goal.point,
    rotation: goal.rotation!,
  };
  const direction: ReturnType<typeof HumanFoot.headingPitch> =
    HumanFoot.headingPitch(placement.rotation);
  const forefoot: IAutoMovieVector3 = HumanFoot.point(
    body,
    side,
    "mtp",
    placement,
  );
  const pitch: number =
    solved ??
    walkLeg.heelRise(
      body,
      side,
      hipOf(body, posture, side, read),
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

/** The heel-rise pitch a stepping foot's rule reaches, for a course of it. */
export namespace rangeSteppingFoot {
  /**
   * The pitch the stepping foot's heel rises to under its hip on a posture
   * (`walkLeg.heelRise`, a search): what a course solved at knots keeps, so a
   * read passes it to `rangeSteppingFoot` and searches nothing.
   *
   * @param body The body.
   * @param posture The posture whose leg goal is the stepping foot.
   * @param side The stepping foot.
   * @param read The FK reader.
   * @param dorsal The ankle's dorsal limit, degrees; an unloaded foot's when
   *   absent.
   * @returns The pitch, degrees, negative toes down.
   */
  export function pitch(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    dorsal?: number,
  ): number {
    const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
    const placement: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: goal.point,
      rotation: goal.rotation!,
    };
    const direction: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(placement.rotation);
    return walkLeg.heelRise(
      body,
      side,
      hipOf(body, posture, side, read),
      HumanFoot.point(body, side, "mtp", placement),
      direction.heading,
      direction.pitch,
      walkLeg.ROCKER,
      dorsal,
    );
  }
}

/** The stepping leg's hip joint on a posture, world metres. */
function hipOf(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  read: ReturnType<typeof prepareHumanPoseResolution>,
): IAutoMovieVector3 {
  return hipJoints(
    body,
    posture.root,
    humanPostureHeading(posture),
    posture.joints.hips,
    read(),
  )[side];
}
