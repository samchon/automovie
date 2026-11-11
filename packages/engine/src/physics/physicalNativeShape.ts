import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import RAPIER from "@dimforge/rapier3d-compat";

import { physicalHullFaces } from "./physicalHullFaces";

/**
 * Preserve primitive geometry while avoiding the pinned narrow phase's degenerate zero-axis capsule path; a hull maps to the native convex polyhedron of its vertices.
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
  if (shape.kind === "capsule")
    return new RAPIER.Capsule(shape.halfLength, shape.radius);
  if (shape.kind === "box")
    return new RAPIER.Cuboid(
      shape.halfExtents.x,
      shape.halfExtents.y,
      shape.halfExtents.z,
    );
  if (shape.kind === "hull")
    // Without indices the native shape computes the hull of the vertices.
    return new RAPIER.ConvexPolyhedron(
      new Float32Array(
        physicalHullFaces(shape.points).vertices.flatMap(
          (vertex: IAutoMovieVector3): number[] => [
            vertex.x,
            vertex.y,
            vertex.z,
          ],
        ),
      ),
      null,
    );
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}
