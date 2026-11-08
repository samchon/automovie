import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Interpolate sampled goals and derive world velocities from the same shortest arc.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Interpolate sampled goals and derive world velocities from the same shortest arc) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Interpolate sampled goals and derive world velocities from the same shortest arc) directly over its typed inputs (`before`, `after`, `fraction`, `rate`) as a fixed number of statements with no loop or recursion in the body, delegating to `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 33 lines and 5 top-level statements that reuses `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `before`, `after`, `fraction`, `rate`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function samplePhysicalTarget(
  before: P.ITransform,
  after: P.ITransform,
  fraction: number,
  rate: number,
): {
  pose: P.ITransform;
  velocity: IAutoMovieVector3;
  angularVelocity: IAutoMovieVector3;
} {
  const delta: P.ITransform["rotation"] = Quaternion.multiply(
    after.rotation,
    Quaternion.inverse(before.rotation),
  );
  const sign: number = delta.w < 0 ? -1 : 1;
  const norm: number = Math.hypot(delta.x, delta.y, delta.z);
  const scale: number =
    norm < 1e-12
      ? 2 * sign * rate
      : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign * rate) / norm;
  return {
    pose: {
      position: Vector3.add(
        before.position,
        Vector3.scale(
          Vector3.subtract(after.position, before.position),
          fraction,
        ),
      ),
      rotation: Quaternion.slerp(before.rotation, after.rotation, fraction),
    },
    velocity: Vector3.scale(
      Vector3.subtract(after.position, before.position),
      rate,
    ),
    angularVelocity: {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    },
  };
}
