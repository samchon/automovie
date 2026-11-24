import { DEFAULT_HUMANOID_ROM, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The wrist's extension limit, degrees: the hand's flexion range's far end
 * (`DEFAULT_HUMANOID_ROM`, flexion negative toward the back of the hand).
 */
const WRIST: number = -DEFAULT_HUMANOID_ROM.leftHand!.flexion!.min;

/**
 * The knuckles' hyperextension limit, degrees (`DEFAULT_HUMANOID_ROM`, the
 * fingers' proximal joints).
 */
const KNUCKLE: number = -DEFAULT_HUMANOID_ROM.leftIndexProximal!.flexion!.min;

/**
 * The thumb's interphalangeal extension limit, degrees
 * (`DEFAULT_HUMANOID_ROM`).
 */
const THUMB_IP: number = -DEFAULT_HUMANOID_ROM.leftThumbDistal!.flexion!.min;

/** Degrees the wrist is kept inside its limit. */
const MARGIN: number = 5;

/**
 * The fingers' proximal joints, whose extension keeps the fingers flat as the
 * palm rises.
 */
const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];

/**
 * A palm laid flat on the floor whose wrist would have to extend past its range
 * to hold it: the arm reaches the palm from above, and a straight arm standing
 * over the hand asks the wrist to bend back by the angle the forearm stands up
 * from the floor behind the fingers. Past the wrist's extension limit the heel
 * of the palm rises about the knuckles, as a foot's heel rises about the toes'
 * joint, and the fingers extend at the knuckles by as much so they stay flat on
 * the floor; the rise is no more than the knuckles' own hyperextension allows.
 * The forearm's direction is read as the line from the wrist to the shoulder,
 * the straight arm's.
 *
 * @param side The hand.
 * @param goal The flat palm's arm goal: its wrist point and the hand's
 *   rotation.
 * @param shoulder The shoulder joint, world metres.
 * @param knuckle The knuckles' offset from the wrist in the hand's frame,
 *   metres.
 * @param fingers The fingers' direction along the floor, a unit vector.
 * @returns The goal and the finger joints, unchanged and empty while the wrist
 *   is within range.
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
  const forearm: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(shoulder, goal.point),
  );
  const extension: number =
    (Math.atan2(Vector3.dot(forearm, up), -Vector3.dot(forearm, fingers)) *
      180) /
    Math.PI;
  const rise: number = Math.min(
    KNUCKLE,
    Math.max(0, extension - (WRIST - MARGIN)),
  );
  if (!(rise > 0)) return { goal, joints: {} };
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    Vector3.normalize(Vector3.cross(up, fingers)),
    rise,
  );
  const pivot: IAutoMovieVector3 = Vector3.add(
    goal.point,
    Quaternion.rotateVector(goal.rotation, knuckle),
  );
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const finger of FINGERS)
    joints[`${side}${finger}Proximal` as AutoMovieHumanoidBone] = [-rise, 0, 0];
  // The thumb's tip lies ahead of the knuckle line too; its only joint
  // that extends is the interphalangeal, which takes back what of the rise
  // its range allows.
  joints[`${side}ThumbDistal` as AutoMovieHumanoidBone] = [
    -Math.min(rise, THUMB_IP),
    0,
    0,
  ];
  return {
    goal: {
      ...goal,
      point: Vector3.add(
        pivot,
        Quaternion.rotateVector(turn, Vector3.subtract(goal.point, pivot)),
      ),
      rotation: Quaternion.normalize(Quaternion.multiply(turn, goal.rotation)),
    },
    joints,
  };
}

/**
 * A palm laid flat on the floor whose wrist would have to extend past its range
 * to hold it rises about the knuckles (`of`), as a foot's heel rises about the
 * toes' joint.
 */
export namespace GymnasticsPalmRise {
  /** A palm laid flat whose heel has risen about the knuckles. */
  export interface IRise {
    /** The arm goal, the hand turned about the knuckles. */
    goal: IAutoMovieHumanLimbGoal;

    /** The fingers' proximal joints, extended by the rise so they stay flat. */
    joints: IAutoMovieMotionHumanPosture["joints"];
  }

  /**
   * The knuckles' offset from the wrist in the hand's frame.
   *
   * @param hand The posed hand bone.
   * @param middle The posed middle finger's proximal bone, whose origin is the
   *   middle knuckle.
   * @returns Metres in the hand's frame.
   */
  export function knuckle(
    hand: IAutoMovieResolvedBone,
    middle: IAutoMovieResolvedBone,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(middle.worldPosition, hand.worldPosition),
    );
  }
}
