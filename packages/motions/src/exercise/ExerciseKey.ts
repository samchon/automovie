import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * A keyed whole-body posture of an exercise: the body's tilt, its turn and
 * its joints, with no place of its own. Where the body is follows from what
 * bears it: the key is pinned by naming bones whose mean stays at a point
 * (`pinned`), so the support neither slides nor sinks while the joints move.
 *
 * Angles are clinical degrees. A leg stood on a flat foot under a pitched
 * trunk is written by `stood`, which gives the hip and the ankle the angles
 * that keep the foot level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a key is, what places it and the unit.
 * @evidence contracts/development/design.md#principled-representation A posture without a root, and the root solved from the bones that bear, so one record serves every support (feet, toes, hands, hips).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The key, its constructors, its blend and mirror, and the pin; read by the workout law and its kind tables.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No key holds a place in metres; the lift is a share of the stature.
 */
export namespace ExerciseKey {
  /** A keyed posture. */
  export interface IKey {
    /** Forward tilt of the whole body, degrees. */
    pitch: number;

    /** Tilt toward the right, degrees. */
    roll: number;

    /** Turn about the vertical from the heading the exercise is entered on, degrees. */
    yaw: number;

    /** How far the pinned bones are lifted off their place, as a share of the stature: a hop. */
    lift: number;

    /** Clinical joint angles, degrees. */
    joints: AutoMovieMotionHumanJoints.Angles;
  }

  /** The whole body's part of a key; every member is 0 when absent. */
  export interface ITrunk {
    /** Forward tilt, degrees. */
    pitch?: number;

    /** Tilt toward the right, degrees. */
    roll?: number;

    /** Turn about the vertical, degrees. */
    yaw?: number;

    /** Lift, a share of the stature. */
    lift?: number;

    /** The spine's `[flexion, lateral, twist]`, degrees. */
    spine?: readonly [number, number, number];

    /** The chest's `[flexion, lateral, twist]`, degrees. */
    chest?: readonly [number, number, number];

    /** The neck's flexion, degrees; negative looks up. */
    neck?: number;
  }

  /** One side's limbs in a key; a member absent keeps the value both sides share, or 0, or for the shoulder's abduction and the elbow their relaxed 5 and 12 degrees. */
  export interface ILimb {
    /** Hip flexion, degrees. */
    hip?: number;

    /** Hip abduction, degrees. */
    spread?: number;

    /** Hip rotation, degrees. */
    turn?: number;

    /** Knee flexion, degrees. */
    knee?: number;

    /** Ankle dorsiflexion, degrees; negative points the foot. */
    ankle?: number;

    /** Toe extension, degrees. */
    toes?: number;

    /** Shoulder flexion, degrees. */
    shoulder?: number;

    /** Shoulder abduction, degrees. */
    raise?: number;

    /** Shoulder rotation, degrees. */
    twist?: number;

    /** Elbow flexion, degrees. */
    elbow?: number;

    /** Wrist flexion, degrees; negative bends the hand back, as a palm laid on the floor under a straight arm is. */
    wrist?: number;
  }

  /** The key of relaxed standing. */
  export const STOOD: IKey = {
    pitch: 0,
    roll: 0,
    yaw: 0,
    lift: 0,
    joints: stand.RELAXED,
  };

  /**
   * A key from the whole body's part and the limbs' angles.
   *
   * @param trunk The tilt, the turn, the lift and the spine.
   * @param both The angles both sides share.
   * @param left What the left side has instead.
   * @param right What the right side has instead.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Starts from relaxed standing, so the fingers and every joint not named keep their standing angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the two sides and three trunk joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent member takes the value its type states; nothing is inferred.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    trunk: ITrunk,
    both: ILimb,
    left: ILimb = {},
    right: ILimb = {},
  ): IKey {
    const joints: AutoMovieMotionHumanJoints.Angles = { ...stand.RELAXED };
    for (const side of ["left", "right"] as const) {
      const a: ILimb = { ...both, ...(side === "left" ? left : right) };
      joints[`${side}UpperLeg`] = [a.hip ?? 0, a.spread ?? 0, a.turn ?? 0];
      joints[`${side}LowerLeg`] = [a.knee ?? 0, 0, 0];
      joints[`${side}Foot`] = [a.ankle ?? 0, 0, 0];
      joints[`${side}Toes`] = [a.toes ?? 0, 0, 0];
      joints[`${side}UpperArm`] = [a.shoulder ?? 0, a.raise ?? 5, a.twist ?? 0];
      joints[`${side}LowerArm`] = [a.elbow ?? 12, 0, 0];
      joints[`${side}Hand`] = [a.wrist ?? 0, 0, 0];
    }
    joints.spine = trunk.spine ?? [0, 0, 0];
    joints.chest = trunk.chest ?? [0, 0, 0];
    joints.neck = [trunk.neck ?? 0, 0, 0];
    return {
      pitch: trunk.pitch ?? 0,
      roll: trunk.roll ?? 0,
      yaw: trunk.yaw ?? 0,
      lift: trunk.lift ?? 0,
      joints,
    };
  }

  /**
   * A leg stood on a level foot under a pitched trunk: the shank leans
   * forward by `shank`, the knee bends by `knee`, and the hip takes what is
   * left so the thigh meets the pitched pelvis.
   *
   * @param pitch The whole body's forward tilt, degrees.
   * @param knee Knee flexion, degrees.
   * @param shank The shank's forward lean from the vertical, degrees.
   * @returns The hip, knee and ankle angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three inputs and what the angles keep.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh leans back by the knee's flexion less the shank's lean, so the hip's flexion is the pitch plus that, and the ankle's dorsiflexion is the shank's lean.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three sums.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; a combination past a joint's range is the kind table's to avoid.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function stood(pitch: number, knee: number, shank: number): ILimb {
    return { hip: pitch + knee - shank, knee, ankle: shank };
  }

  /**
   * The key a share of the way from one key to another.
   *
   * @param a The key at 0.
   * @param b The key at 1.
   * @param u The share, in [0, 1].
   * @returns The key between.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Linear in joint space, member by member; a joint one key leaves out is 0 there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the union of the two keys' bones.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn is blended as written, so a full turn is keyed as 360 and not shortened to 0.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(a: IKey, b: IKey, u: number): IKey {
    const joints: AutoMovieMotionHumanJoints.Angles = {};
    for (const bone of new Set([
      ...Object.keys(a.joints),
      ...Object.keys(b.joints),
    ]) as Set<AutoMovieHumanoidBone>) {
      const p: readonly [number, number, number] = a.joints[bone] ?? [0, 0, 0];
      const q: readonly [number, number, number] = b.joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        p[0] + (q[0] - p[0]) * u,
        p[1] + (q[1] - p[1]) * u,
        p[2] + (q[2] - p[2]) * u,
      ];
    }
    return {
      pitch: a.pitch + (b.pitch - a.pitch) * u,
      roll: a.roll + (b.roll - a.roll) * u,
      yaw: a.yaw + (b.yaw - a.yaw) * u,
      lift: a.lift + (b.lift - a.lift) * u,
      joints,
    };
  }

  /**
   * The same key on the other side.
   *
   * @param key The key.
   * @returns Its mirror image.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The left and right bones exchange their angles, which are clinical and so already mirrored; the roll, the turn and the midline joints' lateral bend and twist change sign.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the bones.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function mirror(key: IKey): IKey {
    const joints: AutoMovieMotionHumanJoints.Angles = {};
    for (const [bone, angles] of Object.entries(key.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      if (bone.startsWith("left"))
        joints[`right${bone.slice(4)}` as AutoMovieHumanoidBone] = angles;
      else if (bone.startsWith("right"))
        joints[`left${bone.slice(5)}` as AutoMovieHumanoidBone] = angles;
      else joints[bone] = [angles[0], -angles[1], -angles[2]];
    return { ...key, roll: -key.roll, yaw: -key.yaw, joints };
  }

  /**
   * The mean place of bones' origins on a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @param bones The bones.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the posture's joints, without limb goals, then the mean of the named origins.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone the rig lacks throws with its name.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function mean(
    body: IHumanBody,
    posture: IHumanPosture,
    bones: readonly AutoMovieHumanoidBone[],
  ): IAutoMovieVector3 {
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      StrikingBody.trunk(body, posture);
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const bone of bones) {
      const at: IAutoMovieVector3 | undefined =
        resolved.get(bone)?.worldPosition;
      if (at === undefined) throw new Error(`The rig has no bone ${bone}`);
      sum = Vector3.add(sum, at);
    }
    return Vector3.scale(sum, 1 / bones.length);
  }

  /**
   * A key as a posture with its root at the origin.
   *
   * @param key The key.
   * @param yaw The heading the exercise is entered on, degrees.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and where the root is.
   * @evidence contracts/development/implementation.md#principled-implementation The key's tilt and joints with its turn added to the heading and no limb goal, so the joints alone say where the limbs are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function posed(key: IKey, yaw: number): IHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: yaw + key.yaw,
      pitch: key.pitch,
      roll: key.roll,
      joints: key.joints,
      limbs: {},
    };
  }

  /**
   * A key placed by what bears it: the posture whose named bones' mean is at
   * a point, lifted by the key's lift.
   *
   * @param body The body.
   * @param key The key.
   * @param yaw The heading the exercise is entered on, degrees.
   * @param pin The bones that bear.
   * @param at Where their mean stays, world metres.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what the result keeps.
   * @evidence contracts/development/implementation.md#principled-implementation The root is the point less the bones' mean on the key posed at the origin, so the support stays where it is whatever the joints do; the lift is added in the stature's unit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the mean is kept: two pinned bones that the joints move apart each move by half of it, which the kind tables avoid by pinning a pair only in a symmetric key.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pinned(
    body: IHumanBody,
    key: IKey,
    yaw: number,
    pin: readonly AutoMovieHumanoidBone[],
    at: IAutoMovieVector3,
  ): IHumanPosture {
    const free: IHumanPosture = posed(key, yaw);
    const offset: IAutoMovieVector3 = mean(body, free, pin);
    return {
      ...free,
      root: {
        x: at.x - offset.x,
        y: at.y - offset.y + key.lift * body.measure.stature,
        z: at.z - offset.z,
      },
    };
  }
}
