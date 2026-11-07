import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";

/**
 * Freeze the current separating normal and bone-local surface witnesses for a
 * Jacobian probe. The derivative is n dot (Jb-Ja), as derived in Drake's
 * CalcDistanceDerivatives (bdcd5ff, distance_constraint_utilities.cc). Native
 * signed distance remains the nonlinear merit; this model neither moves a
 * body nor reports clearance or an impulse. Inactive pairs have a zero row.
 */
export function linearizePhysicalSeparation(
  geometry: Geometry.IQueries,
  a: Geometry.ICollider,
  b: Geometry.ICollider,
): (first: P.ITransform, second: P.ITransform) => number {
  const receipt: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
    a,
    b,
    0,
  );
  if (!receipt || receipt.separation >= 0) return (): number => 0;
  const first: IAutoMovieVector3 = Vector3.subtract(
    receipt.point,
    Vector3.scale(receipt.normal, receipt.separation / 2),
  );
  const second: IAutoMovieVector3 = Vector3.add(
    receipt.point,
    Vector3.scale(receipt.normal, receipt.separation / 2),
  );
  const localA: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(a.pose.rotation),
    Vector3.subtract(first, a.pose.position),
  );
  const localB: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(b.pose.rotation),
    Vector3.subtract(second, b.pose.position),
  );
  const difference: IAutoMovieVector3 = Vector3.subtract(second, first);
  return (poseA: P.ITransform, poseB: P.ITransform): number =>
    receipt.separation +
    Vector3.dot(
      receipt.normal,
      Vector3.subtract(
        Vector3.subtract(
          physicalSupportPoint(poseB, localB),
          physicalSupportPoint(poseA, localA),
        ),
        difference,
      ),
    );
}
