import { Vector3, physicalHullFaces } from "@automovie/engine";
import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

/**
 * A containing sphere for one admitted profile collider in its own frame.
 * The existing HumanColliders.bound facade serves motion broad phases;
 * this owner keeps their shared kind formulas separate from posed queries.
 *
 * @param shape Admitted sphere, Y capsule, box or convex hull in local metres.
 * @returns A fresh record with shape-local centre and containing radius in metres; a hull centre is borrowed unchanged from its existing geometry owner.
 * @throws {Error} For an unknown shape kind.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A sphere bounds itself, a capsule fits within its half length plus radius, a box within its half diagonal, and a convex hull within its existing vertex-mean radius; rigid placement preserves these containing radii.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the unchanged kind formulas behind HumanColliders.bound while physicalHullFaces remains the hull geometry/preparation owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original origin creation, kind order, radius expressions and unknown-kind error; the sphere is a conservative screen, never a replacement signed-distance result.
 * @evidence contracts/development/implementation.md#efficient-algorithms Primitive kinds take constant work; hulls read existing cached centre/radius and pay their geometry owner's preparation only for a cold points array. The facade adds constant delegation with no second record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads admitted current shape dimensions and shares only physicalHullFaces' existing unchanged-points metadata; operation-local consumers may reuse a bound only while that shape stays unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh ball record with a fresh primitive origin or borrowed immutable hull centre; this owner retains no shape, query, result history or new cache, and existing hull retention stays with its engine owner.
 * @evidence contracts/development/common.md#meaningful-documentation Defines every containing formula, local frame/metre units, admitted-geometry premise, conservative use, failure and fresh-versus-borrowed ownership.
 */
export function HumanColliderBound(shape: IAutoMoviePhysicalShape): {
  /** Shape-local sphere centre, metres; borrowed for a hull and otherwise fresh. */
  centre: IAutoMovieVector3;
  /** Containing radius, metres. */
  radius: number;
} {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (shape.kind === "sphere") return { centre: origin, radius: shape.radius };
  if (shape.kind === "capsule")
    return { centre: origin, radius: shape.halfLength + shape.radius };
  if (shape.kind === "box")
    return { centre: origin, radius: Vector3.length(shape.halfExtents) };
  if (shape.kind === "hull") {
    const hull: IAutoMoviePhysicalHullFaces.IHull = physicalHullFaces(shape.points);
    return { centre: hull.centre, radius: hull.radius };
  }
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}
