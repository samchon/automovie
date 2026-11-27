import type { Plane, Vector3 } from "three";

/*
 * Clip the first `count` vertices of a convex polygon to the plane's inward
 * half-space. The plane itself is inside. Write to separate preallocated output
 * vectors and return the number of vertices written.
 */
export function clipInspectionPolygon(
  polygon: readonly Vector3[],
  count: number,
  plane: Plane,
  output: Vector3[],
): number {
  let written: number = 0;
  for (let k: number = 0; k < count; ++k) {
    const current: Vector3 = polygon[k]!;
    const next: Vector3 = polygon[(k + 1) % count]!;
    const a: number = plane.distanceToPoint(current);
    const b: number = plane.distanceToPoint(next);
    if (a >= 0) output[written++]!.copy(current);
    if (a >= 0 !== b >= 0)
      output[written++]!.lerpVectors(current, next, a / (a - b));
  }
  return written;
}
