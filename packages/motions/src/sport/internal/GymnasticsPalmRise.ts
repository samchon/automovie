import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsPalmRiseData } from "./GymnasticsPalmRiseData";

/*
 * A palm laid flat on the floor whose wrist would have to extend past its range
 * to hold it: the arm reaches the palm from above, and a straight arm standing
 * over the hand asks the wrist to bend back by the angle the forearm stands up
 * from the floor behind the fingers. Past the wrist's extension limit the heel
 * of the palm rises about the knuckles, as a foot's heel rises about the toes'
 * joint, and the fingers extend at the knuckles by as much so they stay flat on
 * the floor; the rise is no more than the knuckles' own hyperextension allows.
 * The forearm's direction is read as the line from the wrist to the shoulder,
 * the straight arm's.
 * Parameter side: The hand.
 * Parameter goal: The flat palm's arm goal: its wrist point and the hand's
 * rotation.
 * Parameter shoulder: The shoulder joint, world metres.
 * Parameter knuckle: The knuckles' offset from the wrist in the hand's frame,
 * metres.
 * Parameter fingers: The fingers' direction along the floor, a unit vector.
 * Returns: The goal and the finger joints, unchanged and empty while the wrist
 * is within range.
 */
export function GymnasticsPalmRise(
  side: AutoMovieHumanSide,
  goal: IAutoMovieHumanLimbGoal,
  shoulder: IAutoMovieVector3,
  knuckle: IAutoMovieVector3,
  fingers: IAutoMovieVector3,
): GymnasticsPalmRise.IRise {
  if (goal.rotation === undefined) return { goal, joints: {} };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const forearm: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(shoulder, goal.point),
  );
  const extension: number =
    (Math.atan2(AutoMovieEngineVector3.dot(forearm, up), -AutoMovieEngineVector3.dot(forearm, fingers)) *
      180) /
    Math.PI;
  const rise: number = Math.min(
    GymnasticsPalmRiseData.KNUCKLE,
    Math.max(0, extension - (GymnasticsPalmRiseData.WRIST - GymnasticsPalmRiseData.MARGIN)),
  );
  if (!(rise > 0)) return { goal, joints: {} };
  const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.cross(up, fingers)),
    rise,
  );
  const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    goal.point,
    AutoMovieEngineQuaternion.rotateVector(goal.rotation, knuckle),
  );
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const finger of GymnasticsPalmRiseData.FINGERS)
    joints[`${side}${finger}Proximal` as AutoMovieHumanoidBone] = [-rise, 0, 0];
  // The thumb's tip lies ahead of the knuckle line too; its only joint
  // that extends is the interphalangeal, which takes back what of the rise
  // its range allows.
  joints[`${side}ThumbDistal` as AutoMovieHumanoidBone] = [
    -Math.min(rise, GymnasticsPalmRiseData.THUMB_IP),
    0,
    0,
  ];
  return {
    goal: {
      ...goal,
      point: AutoMovieEngineVector3.add(
        pivot,
        AutoMovieEngineQuaternion.rotateVector(turn, AutoMovieEngineVector3.subtract(goal.point, pivot)),
      ),
      rotation: AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(turn, goal.rotation)),
    },
    joints,
  };
}

/*
 * A palm laid flat on the floor whose wrist would have to extend past its range
 * to hold it rises about the knuckles (`of`), as a foot's heel rises about the
 * toes' joint.
 */
export namespace GymnasticsPalmRise {
  /*
   * A palm laid flat whose heel has risen about the knuckles.
   */
  export interface IRise {
    /*
     * The arm goal, the hand turned about the knuckles.
     */
    goal: IAutoMovieHumanLimbGoal;

    /*
     * The fingers' proximal joints, extended by the rise so they stay flat.
     */
    joints: IAutoMovieMotionHumanPosture["joints"];
  }

  /*
   * The knuckles' offset from the wrist in the hand's frame.
   * Parameter hand: The posed hand bone.
   * Parameter middle: The posed middle finger's proximal bone, whose origin is the
   * middle knuckle.
   * Returns: Metres in the hand's frame.
   */
  export function knuckle(
    hand: IAutoMovieResolvedBone,
    middle: IAutoMovieResolvedBone,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(hand.worldRotation),
      AutoMovieEngineVector3.subtract(middle.worldPosition, hand.worldPosition),
    );
  }
}
