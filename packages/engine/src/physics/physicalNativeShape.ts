import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER from "@dimforge/rapier3d-compat";

/**
 * Preserve primitive geometry while avoiding the pinned narrow phase's degenerate zero-axis capsule path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Preserve primitive geometry while avoiding the pinned narrow phase's degenerate zero-axis capsule path) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Preserve primitive geometry while avoiding the pinned narrow phase's degenerate zero-axis capsule path) directly over its typed inputs (`shape`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 14 lines and 2 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `shape`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalNativeShape(shape: P.IShape): RAPIER.Shape {
  if (
    shape.kind === "sphere" ||
    (shape.kind === "capsule" && shape.halfLength === 0)
  )
    return new RAPIER.Ball(shape.radius);
  return shape.kind === "capsule"
    ? new RAPIER.Capsule(shape.halfLength, shape.radius)
    : new RAPIER.Cuboid(
        shape.halfExtents.x,
        shape.halfExtents.y,
        shape.halfExtents.z,
      );
}
