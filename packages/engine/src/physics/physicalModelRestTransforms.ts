import type {
  IAutoMovieBone,
  IAutoMovieModel,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Neutral bone transforms in the model frame, using the same unscaled rest FK as pose resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Neutral bone transforms in the model frame, using the same unscaled rest FK as pose resolution) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Neutral bone transforms in the model frame, using the same unscaled rest FK as pose resolution) directly over its typed inputs (`model`) as nested iteration of depth 2 (map over pending; filter over pending; while loop), delegating to `pending.map`, `pending.filter`, `pending.findIndex`, `transforms.has`, `pending.splice`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 37 lines and 6 top-level statements that reuses `pending.map`, `pending.filter`, `pending.findIndex`, `transforms.has`, `pending.splice` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `model`; the dominant cost is nested iteration of depth 2 (map over pending; filter over pending; while loop), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalModelRestTransforms(
  model: IAutoMovieModel,
): Map<string, P.ITransform> {
  const transforms: Map<string, P.ITransform> = new Map();
  if (!model.skeleton) return transforms;
  const pending: typeof model.skeleton.bones = [...model.skeleton.bones];
  if (
    new Set(pending.map((bone: (typeof pending)[number]): string => bone.bone))
      .size !== pending.length ||
    pending.filter(
      (bone: (typeof pending)[number]): boolean => bone.parent === null,
    ).length !== 1
  )
    throw new Error("Physical model requires unique bones and one root");
  while (pending.length) {
    const index: number = pending.findIndex(
      (bone: IAutoMovieBone): boolean =>
        bone.parent === null || transforms.has(bone.parent),
    );
    if (index < 0)
      throw new Error("Physical model skeleton is disconnected or cyclic");
    const bone: (typeof pending)[number] = pending.splice(index, 1)[0]!;
    const parent: P.ITransform =
      bone.parent === null
        ? {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          }
        : transforms.get(bone.parent)!;
    transforms.set(bone.bone, {
      position: Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, bone.rest.translation),
      ),
      rotation: Quaternion.multiply(parent.rotation, bone.rest.rotation),
    });
  }
  return transforms;
}
