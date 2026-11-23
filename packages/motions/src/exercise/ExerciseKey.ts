import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { StrikingBody } from "../striking/StrikingBody";
import { prepareExerciseKeyBlend } from "./prepareExerciseKeyBlend";

/**
 * A keyed whole-body posture of an exercise: the body's tilt, its turn and its
 * joints, with no place of its own. Where the body is follows from what bears
 * it: the key is pinned by naming bones whose mean stays at a point (`pinned`),
 * so the support neither slides nor sinks while the joints move.
 *
 * Angles are clinical degrees. A leg stood on a flat foot under a pitched trunk
 * is written by `stood`, which gives the hip and the ankle the angles that keep
 * the foot level.
 */
export namespace ExerciseKey {
  /**
   * The key of a body's relaxed standing: its arms hanging as the stand law
   * hangs them (`stand.relaxed`). A plan that names it in its spans holds the
   * one record it built, so its spans compare it by identity.
   *
   * @param body The body.
   * @returns The key.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return {
      pitch: 0,
      roll: 0,
      yaw: 0,
      lift: 0,
      joints: stand.relaxed(body),
    };
  }

  /**
   * The key of a displayed pose: every joint as the pose shows it, with no
   * tilt, turn or lift of its own, so a law that leaves the pose starts from
   * the body as it was shown, its stance and its feet, rather than from a
   * relaxed stand the cut would jump to.
   *
   * @param pose The displayed pose, an action's entry.
   * @returns The key.
   */
  export function shown(
    pose: IAutoMoviePose,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    const joints: IAutoMovieMotionHumanJoints.Angles = {};
    for (const joint of pose.joints)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    return { pitch: 0, roll: 0, yaw: 0, lift: 0, joints };
  }

  /**
   * A key from the whole body's part and the limbs' angles, on a body: an arm's
   * unstated abduction and elbow are the body's relaxed ones
   * (`stand.relaxed`).
   *
   * @param body The body.
   * @param trunk The tilt, the turn, the lift and the spine.
   * @param both The angles both sides share.
   * @param left What the left side has instead.
   * @param right What the right side has instead.
   * @returns The key.
   */
  export function from(
    body: IAutoMovieMotionHumanBody,
    trunk: IAutoMovieMotionHumanExerciseKey.ITrunk,
    both: IAutoMovieMotionHumanExerciseKey.ILimb,
    left: IAutoMovieMotionHumanExerciseKey.ILimb = {},
    right: IAutoMovieMotionHumanExerciseKey.ILimb = {},
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    const rest: IAutoMovieMotionHumanJoints.Angles = standing(body).joints;
    const joints: IAutoMovieMotionHumanJoints.Angles = { ...rest };
    for (const side of ["left", "right"] as const) {
      const a: IAutoMovieMotionHumanExerciseKey.ILimb = {
        ...both,
        ...(side === "left" ? left : right),
      };
      const arm: readonly [number, number, number] = rest[`${side}UpperArm`]!;
      const elbow: readonly [number, number, number] = rest[`${side}LowerArm`]!;
      joints[`${side}UpperLeg`] = [a.hip ?? 0, a.spread ?? 0, a.turn ?? 0];
      joints[`${side}LowerLeg`] = [a.knee ?? 0, 0, 0];
      joints[`${side}Foot`] = [a.ankle ?? 0, 0, 0];
      joints[`${side}Toes`] = [a.toes ?? 0, 0, 0];
      joints[`${side}UpperArm`] = [
        a.shoulder ?? 0,
        a.raise ?? arm[1],
        a.twist ?? 0,
      ];
      joints[`${side}LowerArm`] = [a.elbow ?? elbow[0], 0, 0];
      joints[`${side}Hand`] = [a.wrist ?? 0, 0, 0];
      joints[`${side}Shoulder`] = [0, a.shrug ?? 0, 0];
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
   * A leg stood on a level foot under a pitched trunk: the shank leans forward
   * by `shank`, the knee bends by `knee`, and the hip takes what is left so the
   * thigh meets the pitched pelvis.
   *
   * @param pitch The whole body's forward tilt, degrees.
   * @param knee Knee flexion, degrees.
   * @param shank The shank's forward lean from the vertical, degrees.
   * @returns The hip, knee and ankle angles.
   */
  export function stood(
    pitch: number,
    knee: number,
    shank: number,
  ): IAutoMovieMotionHumanExerciseKey.ILimb {
    return { hip: pitch + knee - shank, knee, ankle: shank };
  }

  /**
   * A random-access blend reader for two fixed keys, sharing their ordered
   * joint union (`prepareExerciseKeyBlend`).
   */
  export const prepareBlend: typeof prepareExerciseKeyBlend =
    prepareExerciseKeyBlend;

  /**
   * The same key on the other side.
   *
   * @param key The key.
   * @returns Its mirror image.
   */
  export function mirror(
    key: IAutoMovieMotionHumanExerciseKey.IKey,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    const joints: IAutoMovieMotionHumanJoints.Angles = {};
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
   * The mean place of bones' origins, or of grip sockets, on a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @param bones The bones or grip sockets.
   * @param resolved An exact map for this same body and posture from the
   *   caller's synchronous evaluation; when absent the full raw trunk read is
   *   retained.
   * @returns World metres.
   */
  export function mean(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    bones: readonly IAutoMovieMotionHumanExerciseKey.Pin[],
    resolved?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    const placed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      resolved ?? StrikingBody.trunk(body, posture);
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const bone of bones) sum = Vector3.add(sum, at(body, placed, bone));
    return Vector3.scale(sum, 1 / bones.length);
  }

  /**
   * A pin's place on resolved bones: a bone's origin, or a grip socket's point
   * on its hand.
   *
   * @param body The body.
   * @param resolved The resolved bones.
   * @param pin The bone or grip socket.
   * @returns World metres.
   * @throws {Error} When the rig has no such bone.
   */
  export function at(
    body: IAutoMovieMotionHumanBody,
    resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    pin: IAutoMovieMotionHumanExerciseKey.Pin,
  ): IAutoMovieVector3 {
    if (pin === "gripLeft" || pin === "gripRight") {
      const socket: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["gripLeft"] =
        body.surfaces.sockets[pin];
      const bone: IAutoMovieResolvedBone | undefined = resolved.get(
        socket.bone,
      );
      if (bone === undefined)
        throw new Error(`The rig has no bone ${socket.bone}`);
      return resolveAutoMovieHumanoidSurfaces.point(socket, bone);
    }
    const found: IAutoMovieVector3 | undefined =
      resolved.get(pin)?.worldPosition;
    if (found === undefined) throw new Error(`The rig has no bone ${pin}`);
    return found;
  }

  /**
   * A key as a posture with its root at the origin.
   *
   * @param key The key.
   * @param yaw The heading the exercise is entered on, degrees.
   * @returns The posture.
   */
  export function posed(
    key: IAutoMovieMotionHumanExerciseKey.IKey,
    yaw: number,
  ): IAutoMovieMotionHumanPosture {
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
   * A key placed by what bears it: the posture whose named bones' mean is at a
   * point, lifted by the key's lift.
   *
   * @param body The body.
   * @param key The key.
   * @param yaw The heading the exercise is entered on, degrees.
   * @param pin The bones, or the grip sockets, that bear.
   * @param place Where their mean stays, world metres.
   * @param requested Optional output demand containing every pin bone, or its
   *   socket's bone; omitted, the full raw trunk read is retained.
   * @param resolution Optional same-person FK reader/supplier borrowed only by
   *   this actual pin observation.
   * @param projection Optional genuine same-body ROM projector; every actual
   *   direct joint still passes canonical admission.
   * @returns The posture.
   */
  export function pinned(
    body: IAutoMovieMotionHumanBody,
    key: IAutoMovieMotionHumanExerciseKey.IKey,
    yaw: number,
    pin: readonly IAutoMovieMotionHumanExerciseKey.Pin[],
    place: IAutoMovieVector3,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    resolution?: Parameters<typeof StrikingBody.trunk>[2],
    projection?: Parameters<typeof StrikingBody.trunk>[4],
  ): IAutoMovieMotionHumanPosture {
    const free: IAutoMovieMotionHumanPosture = posed(key, yaw);
    const offset: IAutoMovieVector3 = mean(
      body,
      free,
      pin,
      requested === undefined &&
        resolution === undefined &&
        projection === undefined
        ? undefined
        : StrikingBody.trunk(body, free, resolution, requested, projection),
    );
    return {
      ...free,
      root: {
        x: place.x - offset.x,
        y: place.y - offset.y + key.lift * body.measure.stature,
        z: place.z - offset.z,
      },
    };
  }
}
