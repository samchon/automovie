import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanMount } from "./HumanMount";

/*
 * A leg that has lost its stirrup on a seat sat astride: the thigh dropped and
 * spread in `HumanMount.HANG.astride`'s direction from its hip joint, the shank
 * hanging plumb under the knee, the foot level and bearing on nothing, as a
 * sitting leg with no rest hangs (`HumanMountOn`).
 * Parameter body: The body.
 * Parameter posture: The seated posture, in the carrier frame whose `+Y` is up.
 * Parameter side: The leg.
 * Returns: The hanging leg's goal.
 */
export function hangMountedLeg(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
): IAutoMovieHumanLimbGoal {
  const turn: IAutoMovieQuaternion = humanPostureHeading({
    ...posture,
    pitch: 0,
    roll: 0,
  });
  const hip: IAutoMovieVector3 = hipJoints(
    body,
    posture.root,
    humanPostureHeading(posture),
    posture.joints.hips,
  )[side];
  const [out, down, ahead]: readonly [number, number, number] =
    HumanMount.HANG.astride;
  const thigh: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    turn,
    AutoMovieEngineVector3.normalize({ x: side === "left" ? out : -out, y: down, z: ahead }),
  );
  const knee: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    hip,
    AutoMovieEngineVector3.scale(thigh, body.measure.thigh),
  );
  return {
    point: { ...knee, y: knee.y - body.measure.shank },
    bend: AutoMovieEngineVector3.add(
      knee,
      AutoMovieEngineQuaternion.rotateVector(turn, { x: 0, y: 0, z: body.measure.thigh }),
    ),
    rotation: turn,
    planted: false,
  };
}
