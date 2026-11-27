import type { AutoMovieEnginePhysics } from "../AutoMovieEnginePhysics";
import type { AutoMovieEnginePhysicsContactTypes } from "../AutoMovieEnginePhysicsContactTypes";
import type {
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { physicalShapeContactManifold } from "./physicalShapeContactManifold";
import { physicalShapeSupport } from "./physicalShapeSupport";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Freeze the current separating normal and the bone-local witnesses of the
 * contact patch for a Jacobian probe. Each patch point's separation moves by n
 * dot (Jb-Ja), as derived in Drake's CalcDistanceDerivatives (bdcd5ff,
 * distance_constraint_utilities.cc); the row is the least of them, the
 * separation of the patch point that presses deepest. Two faces touching along
 * a patch (Ericson, "Real-Time Collision Detection", 2005, sec. 5.5; Gregorius,
 * "Robust Contact Creation for Physics Simulations", GDC 2015) deepen at the
 * patch corner a relative turn drives in, which one witness cannot see; a
 * vertex or crossing-edge contact has one point and keeps its exact derivative.
 * The patch is `physicalShapeContactManifold`'s, counting features tied up to
 * the roundoff of the poses: the square root of the double-precision epsilon
 * times the metre scale of the pair's positions. Without a patch point, the
 * measured witnesses are the one point. When pushing the pair apart the other
 * way along the same axis needs the same depth (two bars crossing at equal
 * centres), the signed distance has a kink there: the other side is modelled
 * the same way and the row is the greater of the two, the signed distance's own
 * first-order form, a maximum over separating directions. The row is piecewise
 * linear in the poses where a patch has several points or both sides tie; the
 * articulated solver reads its slope on each side (solvePhysicalTargetForest).
 * Native signed distance remains the nonlinear merit; this model neither moves
 * a body nor reports clearance or an impulse. Inactive pairs have a zero row. A
 * supplied measurement must belong to these exact colliders and poses; null
 * retains the already measured inactive pair without querying it again.
 */
export function linearizePhysicalSeparation(
  geometry: IAutoMoviePreparePhysicalGeometry.IQueries,
  a: IAutoMoviePreparePhysicalGeometry.ICollider,
  b: IAutoMoviePreparePhysicalGeometry.ICollider,
  measured?: ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]>,
): (
  first: IAutoMovieRigidTransform,
  second: IAutoMovieRigidTransform,
) => number {
  const receipt: ReturnType<
    IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
  > = measured === undefined ? geometry.contact(a, b, 0) : measured;
  if (!receipt || receipt.separation >= 0) return (): number => 0;
  const scale: number = Math.max(
    1,
    Vector3.length(a.pose.position),
    Vector3.length(b.pose.position),
  );
  const band: number = Math.sqrt(Number.EPSILON) * scale;
  const sides: AutoMovieEnginePhysics.IPhysicalSeparationSide[] = [
    side(a, b, receipt.normal, receipt.separation, band, [
      {
        pointA: Vector3.subtract(
          receipt.point,
          Vector3.scale(receipt.normal, receipt.separation / 2),
        ),
        pointB: Vector3.add(
          receipt.point,
          Vector3.scale(receipt.normal, receipt.separation / 2),
        ),
      },
    ]),
  ];
  // Pushed out the other way along the same axis, the pair may need the
  // same depth: the signed distance then has a kink, and both sides model it.
  const opposite: IAutoMovieVector3 = Vector3.scale(receipt.normal, -1);
  const gap: number =
    Vector3.dot(
      opposite,
      physicalShapeSupport(b.pose, b.shape, receipt.normal),
    ) - Vector3.dot(opposite, physicalShapeSupport(a.pose, a.shape, opposite));
  if (Math.abs(gap - receipt.separation) <= band) {
    const other: AutoMovieEnginePhysics.IPhysicalSeparationSide = side(
      a,
      b,
      opposite,
      gap,
      band,
      [],
    );
    if (other.witnesses.length) sides.push(other);
  }
  return (
    poseA: IAutoMovieRigidTransform,
    poseB: IAutoMovieRigidTransform,
  ): number =>
    Math.max(
      ...sides.map(
        (entry: AutoMovieEnginePhysics.IPhysicalSeparationSide): number =>
          entry.separation +
          Math.min(
            ...entry.witnesses.map(
              (witness: AutoMovieEnginePhysics.IPhysicalSeparationWitness): number =>
                Vector3.dot(
                  entry.normal,
                  Vector3.subtract(
                    Vector3.subtract(
                      physicalSupportPoint(poseB, witness.localB),
                      physicalSupportPoint(poseA, witness.localA),
                    ),
                    witness.difference,
                  ),
                ),
            ),
          ),
      ),
    );
}
/**
 * One side's frozen patch along a normal; the given witnesses when the patch is
 * empty.
 */
function side(
  a: IAutoMoviePreparePhysicalGeometry.ICollider,
  b: IAutoMoviePreparePhysicalGeometry.ICollider,
  normal: IAutoMovieVector3,
  separation: number,
  band: number,
  fallback: AutoMovieEnginePhysicsContactTypes.IPoint[],
): AutoMovieEnginePhysics.IPhysicalSeparationSide {
  const patch: AutoMovieEnginePhysicsContactTypes.IPoint[] =
    physicalShapeContactManifold(
      a.pose,
      a.shape,
      b.pose,
      b.shape,
      normal,
      band,
    );
  return {
    normal,
    separation,
    witnesses: (patch.length ? patch : fallback).map(
      (
        point: AutoMovieEnginePhysicsContactTypes.IPoint,
      ): AutoMovieEnginePhysics.IPhysicalSeparationWitness => ({
        localA: local(a.pose, point.pointA),
        localB: local(b.pose, point.pointB),
        difference: Vector3.subtract(point.pointB, point.pointA),
      }),
    ),
  };
}

/** A world point in a pose's frame. */
function local(
  pose: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(pose.rotation),
    Vector3.subtract(point, pose.position),
  );
}
