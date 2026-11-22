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

/** The wrist's extension limit, degrees: the hand's flexion range's far end (`DEFAULT_HUMANOID_ROM`, flexion negative toward the back of the hand). */
const WRIST: number = -DEFAULT_HUMANOID_ROM.leftHand!.flexion!.min;

/** The knuckles' hyperextension limit, degrees (`DEFAULT_HUMANOID_ROM`, the fingers' proximal joints). */
const KNUCKLE: number = -DEFAULT_HUMANOID_ROM.leftIndexProximal!.flexion!.min;

/** Degrees the wrist is kept inside its limit. */
const MARGIN: number = 5;

/** The fingers' proximal joints, whose extension keeps the fingers flat as the palm rises. */
const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];

/**
 * A palm laid flat on the floor whose wrist would have to extend past its
 * range to hold it rises about the knuckles (`of`), as a foot's heel rises
 * about the toes' joint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace owns.
 * @evidence contracts/development/design.md#principled-representation A turned arm goal and the fingers' joints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rise, its result and the knuckle reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limits are the range table's.
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
   * A palm laid flat on the floor whose wrist would have to extend past its
   * range to hold it: the arm reaches the palm from above, and a straight arm
   * standing over the hand asks the wrist to bend back by the angle the
   * forearm stands up from the floor behind the fingers. Past the wrist's
   * extension limit the heel of the palm rises about the knuckles, as a
   * foot's heel rises about the toes' joint, and the fingers extend at the
   * knuckles by as much so they stay flat on the floor; the rise is no more
   * than the knuckles' own hyperextension allows. The forearm's direction is
   * read as the line from the wrist to the shoulder, the straight arm's.
   *
   * @param side The hand.
   * @param goal The flat palm's arm goal: its wrist point and the hand's rotation.
   * @param shoulder The shoulder joint, world metres.
   * @param knuckle The knuckles' offset from the wrist in the hand's frame, metres.
   * @param fingers The fingers' direction along the floor, a unit vector.
   * @returns The goal and the finger joints, unchanged and empty while the wrist is within range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the palm rises, about what, by how much, the fingers' share and the forearm's reading.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's extension as the forearm's angle up from the floor behind the fingers; the excess over the limit turned about the knuckle line, capped by the knuckles' range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Extension, excess, turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limits are the range table's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work None needed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    side: AutoMovieHumanSide,
    goal: IAutoMovieHumanLimbGoal,
    shoulder: IAutoMovieVector3,
    knuckle: IAutoMovieVector3,
    fingers: IAutoMovieVector3,
  ): IRise {
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
      joints[`${side}${finger}Proximal` as AutoMovieHumanoidBone] = [
        -rise,
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
        rotation: Quaternion.normalize(
          Quaternion.multiply(turn, goal.rotation),
        ),
      },
      joints,
    };
  }

  /**
   * The knuckles' offset from the wrist in the hand's frame.
   *
   * @param hand The posed hand bone.
   * @param middle The posed middle finger's proximal bone, whose origin is the middle knuckle.
   * @returns Metres in the hand's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The middle knuckle's world offset turned back by the hand's rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One subtraction, one turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read from the posed rig, never typed in.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work None needed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
