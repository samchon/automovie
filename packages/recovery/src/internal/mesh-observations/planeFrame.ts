import { Plane } from "./Plane";
import { V3 } from "./V3";
import { cross } from "./cross";
import { dot } from "./dot";
import { len } from "./len";
import { mul } from "./mul";
import { norm } from "./norm";
import { sub } from "./sub";

/**
 * Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Projection of the reference onto the normal-orthogonal plane and cross products construct a right-handed orthonormal frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Normal and reference degeneracies are rejected where their physical meaning is owned.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/development/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant vector arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a frame with fresh axis triples and retains no global state.
 */
export function planeFrame(origin: V3, normal: V3, reference: V3): Plane {
  if (len(normal) === 0) throw new Error("Cutting plane normal is zero");
  const n: V3 = norm(normal);
  const projected: V3 = sub(reference, mul(n, dot(reference, n)));
  if (len(projected) < 1e-6)
    throw new Error("Plane reference is parallel to its normal");
  const v: V3 = norm(projected);
  return { origin, n, u: cross(v, n), v };
}
