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

  /**
   * The key of a body's relaxed standing: its arms hanging as the stand law
   * hangs them (`stand.relaxed`). A plan that names it in its spans holds the
   * one record it built, so its spans compare it by identity.
   *
   * @param body The body.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the key holds and who owns its identity.
   * @evidence contracts/development/implementation.md#principled-implementation The stand law's relaxed arms, the one owner of a hanging arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The workout plan builds it once and keeps it for its spans; nothing is cached here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function standing(body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanExerciseKey.IKey {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the key holds and why a law reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The pose's own clinical angles, the joints a key holds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the pose's joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent angle is zero, as the pose states it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pose's joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function shown(pose: IAutoMoviePose): IAutoMovieMotionHumanExerciseKey.IKey {
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
   * A key from the whole body's part and the limbs' angles, on a body: an
   * arm's unstated abduction and elbow are the body's relaxed ones
   * (`stand.relaxed`).
   *
   * @param body The body.
   * @param trunk The tilt, the turn, the lift and the spine.
   * @param both The angles both sides share.
   * @param left What the left side has instead.
   * @param right What the right side has instead.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Starts from the body's relaxed standing, so the fingers and every joint not named keep their standing angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the two sides and three trunk joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent member takes the value its type states; nothing is inferred.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's relaxed standing (`standing`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
      const a: IAutoMovieMotionHumanExerciseKey.ILimb = { ...both, ...(side === "left" ? left : right) };
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
  export function stood(pitch: number, knee: number, shank: number): IAutoMovieMotionHumanExerciseKey.ILimb {
    return { hip: pitch + knee - shank, knee, ankle: shank };
  }

  /** A random-access blend reader for two fixed keys, sharing their ordered joint union (`prepareExerciseKeyBlend`). */
  export const prepareBlend: typeof prepareExerciseKeyBlend = prepareExerciseKeyBlend;

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
  export function mirror(key: IAutoMovieMotionHumanExerciseKey.IKey): IAutoMovieMotionHumanExerciseKey.IKey {
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
   * @param resolved An exact map for this same body and posture from the caller's synchronous evaluation; when absent the full raw trunk read is retained.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the posture's joints, without limb goals, then the mean of the named origins.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One supplied or raw resolved map and one sum in the given pin order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone the rig lacks throws with its name.
   * @evidence contracts/development/implementation.md#efficient-algorithms The default resolves the trunk; a supplied synchronous map removes repeated resolution, leaving one pass over the named pins.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller may lend only a map resolved for this body and posture whose demand contains every named bone or socket bone; no map is retained here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * A pin's place on resolved bones: a bone's origin, or a grip socket's
   * point on its hand.
   *
   * @param body The body.
   * @param resolved The resolved bones.
   * @param pin The bone or grip socket.
   * @returns World metres.
   * @throws {Error} When the rig has no such bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two kinds of pin and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A socket is placed on its bone by the body's own surfaces, as a held prop's grip is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone the rig lacks throws with its name.
   * @evidence contracts/development/implementation.md#efficient-algorithms A requested bone origin is one map read; a socket uses one actual point rotation/addition, omitting the full frame's unread normal/forward rotations and wrapper.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual resolved bone and body socket pass to the shared canonical surface.point expression; the caller's map is borrowed synchronously and no placed point is cached.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and where the root is.
   * @evidence contracts/development/implementation.md#principled-implementation The key's tilt and joints with its turn added to the heading and no limb goal, so the joints alone say where the limbs are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function posed(key: IAutoMovieMotionHumanExerciseKey.IKey, yaw: number): IAutoMovieMotionHumanPosture {
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
   * @param pin The bones, or the grip sockets, that bear.
   * @param place Where their mean stays, world metres.
   * @param requested Optional output demand containing every pin bone, or its socket's bone; omitted, the full raw trunk read is retained.
   * @param resolution Optional same-person FK reader/supplier borrowed only by this actual pin observation.
   * @param projection Optional genuine same-body ROM projector; every actual direct joint still passes canonical admission.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what the result keeps.
   * @evidence contracts/development/implementation.md#principled-implementation The root is the point less the bones' mean on the key posed at the origin, so the support stays where it is whatever the joints do; the lift is added in the stature's unit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the mean is kept: two pinned bones that the joints move apart each move by half of it, which the kind tables avoid by pinning a pair only in a symmetric key.
   * @evidence contracts/development/implementation.md#efficient-algorithms Full canonical admission remains; an explicit demand computes only its ancestor closure before the pin mean, while omitted demand retains full FK.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one exact map of the posed key is consumed synchronously by mean; no pose or query history is kept.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
    const offset: IAutoMovieVector3 = mean(body, free, pin,
      requested === undefined && resolution === undefined && projection === undefined
        ? undefined : StrikingBody.trunk(body, free, resolution, requested, projection),
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
