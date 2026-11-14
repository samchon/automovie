import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * A posture part of the way from one to another: the weight of an additive
 * layer, as an animator's layer weight scales what the layer adds.
 *
 * `from` is the posture without the layer and `to` the posture with it. The
 * root, the heading, the tips and every joint angle move by the weight; a
 * joint only one of them sets counts as zero in the other. A limb goal both
 * set moves its point and its bend by the weight and keeps everything else
 * of `from` (its planting, its contact, its attachment), since a layer adds
 * to a goal and never changes what holds it; a goal only one of them sets
 * is kept as that one has it.
 *
 * @param from The posture at weight 0.
 * @param to The posture at weight 1.
 * @param weight The weight in [0, 1].
 * @returns The mixed posture; `from` itself at 0 and `to` itself at 1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the two postures are, how each field moves and what a limb goal keeps.
 * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation of the additive difference: clinical angles and world offsets are the quantities a layer adds, so scaling the difference scales the layer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Four scalars, one pass over the joints either sets and one over the four limbs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal's planting, contact and attachment are never mixed; the ends return the given postures unchanged, so a full or absent layer costs and changes nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints the two postures hold.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function mixHumanPosture(
  from: IHumanPosture,
  to: IHumanPosture,
  weight: number,
): IHumanPosture {
  if (weight <= 0) return from;
  if (weight >= 1) return to;
  const lerp = (a: number, b: number): number => a + (b - a) * weight;
  const move = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), weight));
  const joints: IHumanPosture["joints"] = {};
  for (const bone of new Set([
    ...Object.keys(from.joints),
    ...Object.keys(to.joints),
  ]) as Set<AutoMovieHumanoidBone>) {
    const a: readonly [number, number, number] = from.joints[bone] ?? [0, 0, 0];
    const b: readonly [number, number, number] = to.joints[bone] ?? [0, 0, 0];
    joints[bone] = [lerp(a[0], b[0]), lerp(a[1], b[1]), lerp(a[2], b[2])];
  }
  const limbs: IHumanPosture["limbs"] = {};
  for (const limb of ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
    const a: IHumanPosture.IGoal | undefined = from.limbs[limb];
    const b: IHumanPosture.IGoal | undefined = to.limbs[limb];
    const goal: IHumanPosture.IGoal | undefined =
      a === undefined || b === undefined
        ? (a ?? b)
        : {
            ...a,
            point: move(a.point, b.point),
            bend: move(a.bend, b.bend),
          };
    if (goal !== undefined) limbs[limb] = goal;
  }
  return {
    root: move(from.root, to.root),
    yaw: lerp(from.yaw, to.yaw),
    pitch: lerp(from.pitch, to.pitch),
    roll: lerp(from.roll, to.roll),
    joints,
    limbs,
  };
}
