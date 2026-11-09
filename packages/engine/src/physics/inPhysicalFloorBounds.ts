import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { physicalShapeBounds } from "./physicalShapeBounds";

/**
 * Refuse a nonfinite or out-of-domain shape before it can leave the declared finite floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Refuse a nonfinite or out-of-domain shape before it can leave the declared finite floor) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Refuse a nonfinite or out-of-domain shape before it can leave the declared finite floor) directly over its typed inputs (`pose`, `shape`, `floor`) as a fixed number of statements with no loop or recursion in the body, delegating to `physicalShapeBounds`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 14 lines and 2 top-level statements that reuses `physicalShapeBounds`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `pose`, `shape`, `floor`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function inPhysicalFloorBounds(
  pose: P.ITransform,
  shape: P.IShape,
  floor: Simulation.IInput["floorBounds"],
): boolean {
  const bounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
    pose,
    shape,
  );
  return (
    Number.isFinite(bounds.min.y) &&
    Number.isFinite(bounds.max.y) &&
    bounds.min.x >= floor.min.x &&
    bounds.max.x <= floor.max.x &&
    bounds.min.z >= floor.min.z &&
    bounds.max.z <= floor.max.z
  );
}
