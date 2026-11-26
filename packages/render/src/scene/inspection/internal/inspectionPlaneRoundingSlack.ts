import type { Plane, Vector3 } from "three";

/** Bound the roundoff of an inspection plane's signed distance evaluation. */
export function inspectionPlaneRoundingSlack(
  plane: Plane,
  point: Vector3,
): number {
  return (
    32 *
    Number.EPSILON *
    (1 +
      Math.abs(plane.normal.x * point.x) +
      Math.abs(plane.normal.y * point.y) +
      Math.abs(plane.normal.z * point.z) +
      Math.abs(plane.constant))
  );
}
