import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMount } from "./HumanMount";

/**
 * A leg that has lost its stirrup on a seat sat astride: the thigh dropped and spread in `HumanMount.HANG.astride`'s direction from its hip joint, the shank hanging plumb under the knee, the foot level and bearing on nothing, as a sitting leg with no rest hangs (`HumanMountOn`).
 *
 * @param body The body.
 * @param posture The seated posture, in the carrier frame whose `+Y` is up.
 * @param side The leg.
 * @returns The hanging leg's goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hanging leg's shape and its source.
 * @evidence contracts/development/implementation.md#principled-implementation The posture's own hip joint, the thigh along the sitting law's hanging direction mirrored to the side and turned with the pelvis, and the shank straight down.
 * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One construction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hanging direction is `HumanMount.HANG`'s provisional one, shared with sitting.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function hangMountedLeg(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
): IAutoMovieHumanLimbGoal {
  const turn: IAutoMovieQuaternion = resolveHumanPosture.heading({
    ...posture,
    pitch: 0,
    roll: 0,
  });
  const hip: IAutoMovieVector3 = hipJoints(
    body,
    posture.root,
    resolveHumanPosture.heading(posture),
    posture.joints.hips,
  )[side];
  const [out, down, ahead]: readonly [number, number, number] =
    HumanMount.HANG.astride;
  const thigh: IAutoMovieVector3 = Quaternion.rotateVector(
    turn,
    Vector3.normalize({ x: side === "left" ? out : -out, y: down, z: ahead }),
  );
  const knee: IAutoMovieVector3 = Vector3.add(
    hip,
    Vector3.scale(thigh, body.measure.thigh),
  );
  return {
    point: { ...knee, y: knee.y - body.measure.shank },
    bend: Vector3.add(
      knee,
      Quaternion.rotateVector(turn, { x: 0, y: 0, z: body.measure.thigh }),
    ),
    rotation: turn,
    planted: false,
  };
}
