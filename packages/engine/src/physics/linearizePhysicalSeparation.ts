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
 * A supplied measurement must belong to these exact colliders and poses; null
 * retains the already measured inactive pair without querying it again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Freeze the current separating normal and bone-local surface witnesses for a Jacobian probe) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Freeze the current separating normal and bone-local surface witnesses for a Jacobian probe) directly over its typed inputs (`geometry`, `a`, `b`, `measured`) as a fixed number of statements with no loop or recursion in the body, delegating to `geometry.contact`, `Vector3.subtract`, `Vector3.scale`, `Vector3.add`, `Quaternion.rotateVector`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 34 lines and 8 top-level statements that reuses `geometry.contact`, `Vector3.subtract`, `Vector3.scale`, `Vector3.add`, `Quaternion.rotateVector` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `geometry`, `a`, `b`, `measured`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function linearizePhysicalSeparation(
  geometry: Geometry.IQueries,
  a: Geometry.ICollider,
  b: Geometry.ICollider,
  measured?: ReturnType<Geometry.IQueries["contact"]>,
): (first: P.ITransform, second: P.ITransform) => number {
  const receipt: ReturnType<Geometry.IQueries["contact"]> =
    measured === undefined ? geometry.contact(a, b, 0) : measured;
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
