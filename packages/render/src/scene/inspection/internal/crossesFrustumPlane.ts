import type { Box3, Plane } from "three";

/*
 * Whether a box reaches past a frustum plane: its corner farthest along the
 * plane's outward side, the one with the least signed distance, lies outside by
 * more than 32 ulps of the arithmetic that places it.
 *
 * A three.js frustum plane's normal points into the frustum, so a point is
 * outside where `normal · p + constant < 0`. Taking each coordinate from
 * `box.min` where the normal's component is nonnegative and from `box.max`
 * otherwise picks the corner with the least distance. The slack, `32 ε` times
 * one plus the magnitudes summed, keeps a corner lying on the plane, which
 * rounds by a few ulps, from counting as a crossing. The camera inspection's
 * framing grade and the frame edge measure test the same way.
 * Parameter box: World-space bounds.
 * Parameter plane: Frustum plane with an inward normal.
 * Returns: `true` when part of the box lies outside the plane.
 */
export function crossesFrustumPlane(box: Box3, plane: Plane): boolean {
  const { x, y, z }: Plane["normal"] = plane.normal;
  const xx: number = x * (x >= 0 ? box.min.x : box.max.x);
  const yy: number = y * (y >= 0 ? box.min.y : box.max.y);
  const zz: number = z * (z >= 0 ? box.min.z : box.max.z);
  const tolerance: number =
    32 *
    Number.EPSILON *
    (1 + Math.abs(xx) + Math.abs(yy) + Math.abs(zz) + Math.abs(plane.constant));
  return xx + yy + zz + plane.constant < -tolerance;
}
