import { Plane } from "./Plane.ts";
import { V2 } from "./V2.ts";
import { V3 } from "./V3.ts";
import { add } from "./add.ts";
import { mul } from "./mul.ts";

/**
 * Evaluates physical u/v coordinates on the declared plane.
 *
 * @evidence contracts/common.md#principled-implementation An affine combination of the plane origin and unit axes evaluates physical plane coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Consumes the same explicit frame as to2.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant vector arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new point and retains no references.
 */
export const from2 = (plane: Plane, point: V2): V3 =>
  add(plane.origin, add(mul(plane.u, point[0]), mul(plane.v, point[1])));
