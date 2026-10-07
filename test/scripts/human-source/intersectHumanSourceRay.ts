import type { IHumanSourceRayHit } from "./structures/IHumanSourceRayHit.ts";

/**
 * Every hit of a ray `origin + t * direction` (t > 0) with the given oriented
 * triangles (Moller-Trumbore), in triangle order. A triangle parallel to the
 * ray (zero determinant) is passed over; corners and edges count as hits.
 */
export function intersectHumanSourceRay(
  positions: readonly number[],
  triangles: readonly number[],
  origin: readonly number[],
  direction: readonly number[],
): IHumanSourceRayHit[] {
  const cross = (a: readonly number[], b: readonly number[]): number[] => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const dot = (a: readonly number[], b: readonly number[]): number =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const corner = (v: number): number[] => [
    positions[3 * v],
    positions[3 * v + 1],
    positions[3 * v + 2],
  ];
  const hits: IHumanSourceRayHit[] = [];
  for (let k = 0; k < triangles.length; k += 3) {
    const triangle: [number, number, number] = [
      triangles[k],
      triangles[k + 1],
      triangles[k + 2],
    ];
    const [a, b, c] = triangle.map(corner);
    const e1 = [0, 1, 2].map((i) => b[i] - a[i]);
    const e2 = [0, 1, 2].map((i) => c[i] - a[i]);
    const pv = cross(direction, e2);
    const det = dot(e1, pv);
    if (det === 0) continue;
    const tv = [0, 1, 2].map((i) => origin[i] - a[i]);
    const u = dot(tv, pv) / det;
    if (u < 0 || u > 1) continue;
    const q = cross(tv, e1);
    const v = dot(direction, q) / det;
    if (v < 0 || u + v > 1) continue;
    const t = dot(e2, q) / det;
    if (t > 0)
      hits.push({
        triangle,
        u,
        v,
        t,
        facing: dot(cross(e1, e2), direction) > 0,
      });
  }
  return hits;
}
