import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosture } from "./HumanPosture";

/*
 * A posture part of the way from one to another: the weight of an additive
 * layer, as an animator's layer weight scales what the layer adds.
 *
 * `from` is the posture without the layer and `to` the posture with it. The
 * root, the heading, the tips and every joint angle move by the weight; a joint
 * only one of them sets counts as zero in the other. A limb goal both set moves
 * its point and its bend by the weight and keeps everything else of `from` (its
 * planting, its contact, its attachment), since a layer adds to a goal and
 * never changes what holds it; a goal only one of them sets is kept as that one
 * has it. A digit goal moves its point the same way and keeps the rest of
 * `from`'s (its surface, its facing, its attachment), so a hand's grip holds
 * through the mix as it does at both ends. A whole-body `rotation` blends as a
 * rotation, the shorter-arc slerp of the two turns at constant angular speed
 * with a line between their points; a posture without one counts as the
 * identity turn about the other's point.
 * Parameter from: The posture at weight 0.
 * Parameter to: The posture at weight 1.
 * Parameter weight: The weight in [0, 1].
 * Returns: The mixed posture; `from` itself at 0 and `to` itself at 1.
 */
export function mixHumanPosture(
  from: IAutoMovieMotionHumanPosture,
  to: IAutoMovieMotionHumanPosture,
  weight: number,
): IAutoMovieMotionHumanPosture {
  if (weight <= 0) return from;
  if (weight >= 1) return to;
  const lerp = (a: number, b: number): number => a + (b - a) * weight;
  const move = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), weight));
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const bone of new Set([
    ...Object.keys(from.joints),
    ...Object.keys(to.joints),
  ]) as Set<AutoMovieHumanoidBone>) {
    const a: readonly [number, number, number] = from.joints[bone] ?? [0, 0, 0];
    const b: readonly [number, number, number] = to.joints[bone] ?? [0, 0, 0];
    joints[bone] = [lerp(a[0], b[0]), lerp(a[1], b[1]), lerp(a[2], b[2])];
  }
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const limb of ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
    const a: IAutoMovieHumanLimbGoal | undefined = from.limbs[limb];
    const b: IAutoMovieHumanLimbGoal | undefined = to.limbs[limb];
    const goal: IAutoMovieHumanLimbGoal | undefined =
      a === undefined || b === undefined
        ? (a ?? b)
        : {
            ...a,
            point: move(a.point, b.point),
            bend: move(a.bend, b.bend),
          };
    if (goal !== undefined) limbs[limb] = goal;
  }

  // A digit goal either posture holds is kept through the mix, as a limb
  // goal is: a grip dropped between the ends would open the hand mid-blend.
  let digits: IAutoMovieMotionHumanPosture["digits"];
  if (from.digits !== undefined || to.digits !== undefined) {
    digits = {};
    for (const digit of HumanPosture.DIGITS) {
      const a: IAutoMovieHumanDigitGoal | undefined = from.digits?.[digit];
      const b: IAutoMovieHumanDigitGoal | undefined = to.digits?.[digit];
      const goal: IAutoMovieHumanDigitGoal | undefined =
        a === undefined || b === undefined
          ? (a ?? b)
          : { ...a, point: move(a.point, b.point) };
      if (goal !== undefined) digits[digit] = goal;
    }
  }

  // A whole-body turn blends as a rotation: the shorter-arc slerp of the two
  // turns and a line between their points, a missing one the identity turn
  // about the other's point.
  const a: IAutoMovieHumanPostureRotation | undefined = from.rotation;
  const b: IAutoMovieHumanPostureRotation | undefined = to.rotation;
  const rotation: IAutoMovieHumanPostureRotation | undefined =
    a === undefined && b === undefined
      ? undefined
      : {
          about: move((a ?? b)!.about, (b ?? a)!.about),
          turn: Quaternion.slerp(
            a?.turn ?? Quaternion.identity(),
            b?.turn ?? Quaternion.identity(),
            weight,
          ),
        };
  return {
    root: move(from.root, to.root),
    yaw: lerp(from.yaw, to.yaw),
    pitch: lerp(from.pitch, to.pitch),
    roll: lerp(from.roll, to.roll),
    joints,
    limbs,
    ...(rotation === undefined ? {} : { rotation }),
    ...(digits === undefined ? {} : { digits }),
  };
}
