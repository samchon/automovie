import { DEFAULT_HUMANOID_ROM, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * Exclude two wrist goals only when the same grounded pelvis and thorax cannot
 * reach both.
 * Parameter body: The rig supplying bone lengths, clinical ranges and the seat
 * socket.
 * Parameter posture: The seated entry whose yaw and roll the pelvic swing
 * preserves.
 * Parameter seat: The working seat's actual support frame and depth.
 * Parameter origin: The prop's rigid placement in the entry world.
 * Returns: An exclusion test in metres, or undefined for another skeleton
 * topology.
 */
export function fixedSeatGripReach(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  seat: IAutoMovieAffordance,
  origin: IAutoMovieRigidTransform,
): OptionalCheck {
  const socket = body.surfaces.sockets.seat;
  if (
    seat.kind !== "seat" ||
    seat.workingSeat !== true ||
    socket.bone !== "hips" ||
    posture.joints.hips !== undefined
  )
    return undefined;
  const child = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone,
  ): IAutoMovieBone | undefined => {
    const bone: IAutoMovieBone | undefined = body.bones.get(name);
    return bone?.parent === parent ? bone : undefined;
  };
  const hips: IAutoMovieBone | undefined = body.bones.get("hips");
  const spine: IAutoMovieBone | undefined = child("spine", "hips");
  const chest: IAutoMovieBone | undefined = child("chest", "spine");
  const left: IAutoMovieBone | undefined = child("leftShoulder", "chest");
  const right: IAutoMovieBone | undefined = child("rightShoulder", "chest");
  if (
    hips?.parent !== null ||
    spine === undefined ||
    chest === undefined ||
    left === undefined ||
    right === undefined
  )
    return undefined;
  const leftArm: IAutoMovieBone | undefined = child(
    "leftUpperArm",
    "leftShoulder",
  );
  const rightArm: IAutoMovieBone | undefined = child(
    "rightUpperArm",
    "rightShoulder",
  );
  const leftElbow: IAutoMovieBone | undefined = child(
    "leftLowerArm",
    "leftUpperArm",
  );
  const rightElbow: IAutoMovieBone | undefined = child(
    "rightLowerArm",
    "rightUpperArm",
  );
  const leftHand: IAutoMovieBone | undefined = child(
    "leftHand",
    "leftLowerArm",
  );
  const rightHand: IAutoMovieBone | undefined = child(
    "rightHand",
    "rightLowerArm",
  );
  if (
    !leftArm ||
    !rightArm ||
    !leftElbow ||
    !rightElbow ||
    !leftHand ||
    !rightHand
  )
    return undefined;
  const arm: number =
    (Vector3.length(leftElbow.rest.translation) +
      Vector3.length(rightElbow.rest.translation) +
      Vector3.length(leftHand.rest.translation) +
      Vector3.length(rightHand.rest.translation)) /
    2;
  const mid: IAutoMovieVector3 = Vector3.lerp(
    right.rest.translation,
    left.rest.translation,
    0.5,
  );
  const half: IAutoMovieVector3 = Vector3.subtract(left.rest.translation, mid);
  const breadth: number = Vector3.length(half);
  const central: number =
    Vector3.length(Vector3.subtract(spine.rest.translation, socket.point)) +
    Vector3.length(chest.rest.translation) +
    Vector3.length(mid);
  const l: number = Vector3.length(leftArm.rest.translation);
  const r: number = Vector3.length(rightArm.rest.translation);
  if (!(breadth > 0 && l > 0 && r > 0)) return undefined;
  const length: number = (l + r) / 2;
  const cone: number = Math.max(
    clavicleCone(left, leftArm.rest.translation, 1),
    clavicleCone(right, rightArm.rest.translation, -1),
  );
  const cosCone: number = Math.cos(cone);
  const sinCone: number = Math.sin(cone);
  const rest: IAutoMovieRigidTransform = {
    position: Vector3.add(
      origin.position,
      Quaternion.rotateVector(origin.rotation, seat.frame.translation),
    ),
    rotation: Quaternion.multiply(origin.rotation, seat.frame.rotation),
  };
  const leftYaw: IAutoMovieVector3 = {
    x: Math.cos(posture.yaw * RAD),
    y: 0,
    z: -Math.sin(posture.yaw * RAD),
  };
  const turn: number =
    Math.abs(posture.roll * RAD) +
    restTurn(hips) +
    trunkTurn(body, spine) +
    trunkTurn(body, chest);
  const halfAngle: number = angle(half.x / breadth);
  const depth: number = seat.depth ?? Infinity;

  // Project first onto the seat strip. Its full width is available, including either edge.
  function projected(
    frame: IAutoMovieRigidTransform,
    midpoint: IAutoMovieVector3,
    halfSplit: IAutoMovieVector3,
  ): number {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      Z,
    );
    const across: IAutoMovieVector3 = Vector3.scale(
      Quaternion.rotateVector(frame.rotation, X),
      -1,
    );
    const separation: number = angle(Vector3.dot(leftYaw, across));
    const aligned: number = Math.cos(Math.max(0, separation - turn));
    const interval: number = Math.cos(
      Math.max(0, separation - turn - halfAngle),
    );
    const delta: IAutoMovieVector3 = Vector3.subtract(midpoint, frame.position);
    const lateral: number = Vector3.dot(delta, across);
    const along: number = Vector3.dot(delta, forward);
    const off: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(delta, Vector3.scale(across, lateral)),
      Vector3.scale(forward, Math.min(0, Math.max(-depth, along))),
    );
    const sagittal: number = Math.max(0, Vector3.length(off) - central);
    const split: number = Math.max(
      0,
      Vector3.dot(halfSplit, across) - breadth * interval,
    );
    const distance: number = Math.hypot(sagittal, split);
    if (distance === 0 || distance + length <= arm) return 0;
    const dot: number = (aligned * split) / distance;
    const support: number =
      dot >= cosCone
        ? 1
        : dot * cosCone + Math.sqrt(Math.max(0, 1 - dot * dot)) * sinCone;
    return distance - length * support - Math.abs(l - r) / 2;
  }
  return (
    leftWrist: IAutoMovieVector3,
    rightWrist: IAutoMovieVector3,
    placed?: CurrentSeat,
  ): void => {
    const midpoint: IAutoMovieVector3 = Vector3.lerp(
      leftWrist,
      rightWrist,
      0.5,
    );
    const halfSplit: IAutoMovieVector3 = Vector3.subtract(leftWrist, midpoint);
    let minimum: number = projected(rest, midpoint, halfSplit);
    if (minimum <= arm) return;
    if (placed !== undefined) {
      const actual: IAutoMovieRigidTransform | undefined = placed();
      if (actual === undefined) return;
      minimum = projected(actual, midpoint, halfSplit);
    }
    if (minimum > arm)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "hands",
        value: minimum,
        feasible: { kind: "range", minimum: 0, maximum: arm, unit: "m" },
        reason: `the two wrist goals require a mean shoulder distance of at least ${minimum.toFixed(4)} m across this seat; the arms reach ${arm.toFixed(4)} m on average`,
        fix: "choose grips within the seated body's reach",
      });
  };
}

/*
 * The law asks about both actual wrist positions in the seat's entry world.
 */
type CurrentSeat = () => IAutoMovieRigidTransform | undefined;

/*
 * Each check can confirm a moving seat in the same reference frame.
 */
type Check = (
  left: IAutoMovieVector3,
  right: IAutoMovieVector3,
  placed?: CurrentSeat,
) => void;

/*
 * A rig or seat without the necessary articulated frame gives no exclusion.
 */
type OptionalCheck = Check | undefined;
const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const Z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

const RAD: number = Math.PI / 180;

/*
 * Clamp normalized dot products at the endpoints of the inverse cosine.
 */
function angle(dot: number): number {
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/*
 * Greatest excursion of one clinical coordinate in radians.
 */
function excursion(range: IAutoMovieAngleRange | null): number {
  return range === null
    ? 0
    : Math.min(
        Math.PI,
        RAD * Math.max(Math.abs(range.min), Math.abs(range.max)),
      );
}

/*
 * Rotation of the bone's lateral axis due to its fixed bind transform.
 */
function restTurn(bone: IAutoMovieBone): number {
  return angle(Quaternion.rotateVector(bone.rest.rotation, X).x);
}

/*
 * Maximum deviation of a trunk's lateral axis from its parent's lateral axis.
 */
function trunkTurn(
  body: IAutoMovieMotionHumanBody,
  bone: IAutoMovieBone,
): number {
  const limit: IAutoMovieJointConstraint | undefined =
    bone.constraint ?? DEFAULT_HUMANOID_ROM[bone.bone];
  if (limit === undefined || limit.swingTwist !== undefined) return Math.PI;
  const a: number = excursion(limit.abduction);
  const t: number = excursion(limit.twist);
  const axes: IAutoMovieJointAxes | undefined =
    body.poseResolution.jointAxes[bone.bone];
  // The proximal twist and abduction turn X about orthogonal axes; sagittal flexion leaves X fixed.
  const sagittal: boolean =
    axes === undefined ||
    (axes.flexion.y === 0 &&
      axes.flexion.z === 0 &&
      axes.twistPlacement !== "distal");
  return (
    restTurn(bone) +
    (sagittal && a <= Math.PI / 2 && t <= Math.PI / 2
      ? angle(Math.cos(a) * Math.cos(t))
      : Math.min(Math.PI, a + t + excursion(limit.flexion)))
  );
}

/*
 * A clavicle's allowed cone about the chest's outward lateral axis.
 */
function clavicleCone(
  bone: IAutoMovieBone,
  tip: IAutoMovieVector3,
  side: number,
): number {
  const limit: IAutoMovieJointConstraint | undefined =
    bone.constraint ?? DEFAULT_HUMANOID_ROM[bone.bone];
  if (limit === undefined || limit.swingTwist !== undefined) return Math.PI;
  const flex: number = excursion(limit.flexion);
  const abduct: number = excursion(limit.abduction);
  return Math.min(
    Math.PI,
    restTurn(bone) +
      angle((side * tip.x) / Vector3.length(tip)) +
      2 * angle(Math.cos(flex / 2) * Math.cos(abduct / 2)) +
      excursion(limit.twist),
  );
}
