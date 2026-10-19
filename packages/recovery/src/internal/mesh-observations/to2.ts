import { Plane } from "./Plane";
import { V2 } from "./V2";
import { V3 } from "./V3";
import { dot } from "./dot";
import { sub } from "./sub";

/**
 * Projects a point into the plane's physical u/v coordinates; the normal residual is discarded.
 *
 * @evidence contracts/common.md#principled-implementation Dot products against the plane axes project a displacement into physical in-plane coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The documented normal residual is deliberately discarded instead of silently moving the source plane.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant vector arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one coordinate pair and retains no state.
 */
export const to2: (plane: Plane, point: V3) => V2 = (
  plane: Plane,
  point: V3,
): V2 => {
  const relative: V3 = sub(point, plane.origin);
  return [dot(relative, plane.u), dot(relative, plane.v)];
};
