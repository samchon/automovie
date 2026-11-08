import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Compile one interval's motion coefficients. Scalar checks retain direct callers' mutable-transform semantics; returned vectors are independently owned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Compile one interval's motion coefficients) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Compile one interval's motion coefficients) directly over its typed inputs (`before`, `after`, `rate`) as a fixed number of statements with no loop or recursion in the body, delegating to `same`, `Vector3.subtract`, `Vector3.scale`, `Quaternion.multiply`, `Quaternion.inverse`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 47 lines and 6 top-level statements that reuses `same`, `Vector3.subtract`, `Vector3.scale`, `Quaternion.multiply`, `Quaternion.inverse` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `before`, `after`, `rate`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function preparePhysicalTargetSampler(
  before: P.ITransform,
  after: P.ITransform,
  rate: number,
): (fraction: number) => ReturnType<typeof samplePhysicalTarget> {
  let first: P.ITransform | undefined;
  let last: P.ITransform | undefined;
  let displacement: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let angularVelocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return (fraction: number): ReturnType<typeof samplePhysicalTarget> => {
    if (!same(before, first) || !same(after, last)) {
      first = {
        position: { ...before.position },
        rotation: { ...before.rotation },
      };
      last = {
        position: { ...after.position },
        rotation: { ...after.rotation },
      };
      displacement = Vector3.subtract(last.position, first.position);
      velocity = Vector3.scale(displacement, rate);
      const delta: P.ITransform["rotation"] = Quaternion.multiply(
        last.rotation,
        Quaternion.inverse(first.rotation),
      );
      const sign: number = delta.w < 0 ? -1 : 1;
      const norm: number = Math.hypot(delta.x, delta.y, delta.z);
      const scale: number =
        norm < 1e-12
          ? 2 * sign * rate
          : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign * rate) / norm;
      angularVelocity = {
        x: delta.x * scale,
        y: delta.y * scale,
        z: delta.z * scale,
      };
    }
    return {
      pose: {
        position: Vector3.add(
          first!.position,
          Vector3.scale(displacement, fraction),
        ),
        rotation: Quaternion.slerp(first!.rotation, last!.rotation, fraction),
      },
      velocity: { ...velocity },
      angularVelocity: { ...angularVelocity },
    };
  };
}

/** Compare numeric values so in-place receiver or target edits invalidate coefficients too. */
function same(
  actual: P.ITransform,
  previous: P.ITransform | undefined,
): boolean {
  return (
    previous !== undefined &&
    Object.is(actual.position.x, previous.position.x) &&
    Object.is(actual.position.y, previous.position.y) &&
    Object.is(actual.position.z, previous.position.z) &&
    Object.is(actual.rotation.x, previous.rotation.x) &&
    Object.is(actual.rotation.y, previous.rotation.y) &&
    Object.is(actual.rotation.z, previous.rotation.z) &&
    Object.is(actual.rotation.w, previous.rotation.w)
  );
}
