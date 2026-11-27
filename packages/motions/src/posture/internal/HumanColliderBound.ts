import { Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A containing sphere for one admitted profile collider in its own frame. The
 * existing HumanColliders.bound facade serves motion broad phases; this owner
 * keeps their shared kind formulas separate from posed queries.
 * Parameter shape: Admitted sphere, Y capsule, box or convex hull in local metres.
 * Returns: A fresh record with shape-local centre and containing radius in
 * metres; a hull centre is borrowed unchanged from its existing geometry
 * owner.
 * For an unknown shape kind.
 */
export function HumanColliderBound(
  shape: IAutoMoviePhysicalShape,
): IHumanColliderBoundResult {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (shape.kind === "sphere") return { centre: origin, radius: shape.radius };
  if (shape.kind === "capsule")
    return { centre: origin, radius: shape.halfLength + shape.radius };
  if (shape.kind === "box")
    return { centre: origin, radius: Vector3.length(shape.halfExtents) };
  if (shape.kind === "hull") {
    const hull: IAutoMoviePhysicalHullFaces.IHull = AutoMovieEnginePhysics.physicalShapeHull(shape);
    return { centre: hull.centre, radius: hull.radius };
  }
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}

/*
 * The record of `IHumanColliderBoundResult`'s site.
 */
type IHumanColliderBoundResult = {
  /*
   * Shape-local sphere centre, metres; borrowed for a hull and otherwise fresh.
   */
  centre: IAutoMovieVector3;
  /*
   * Containing radius, metres.
   */
  radius: number;
};
