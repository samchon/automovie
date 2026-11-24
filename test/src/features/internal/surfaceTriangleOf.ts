import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The first triangle of an indexed mesh that contains a point lying on its
 * surface, found by the point's distance to each triangle's plane (within 1e-12
 * m) and its barycentric coordinates (within 1e-12); throws when no triangle
 * holds it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A lookup helper for feature-edge and wear tests that address a point by its triangle; it asserts nothing.
 * @evidence contracts/development/testing.md#independent-expectations Plane distance and barycentric containment are computed here from the positions alone, independent of the measured lists.
 * @evidence contracts/development/testing.md#distinguishing-cases Zero-area triangles are skipped; a point on a shared side returns the earlier triangle.
 * @evidence contracts/development/testing.md#execution-ownership Pure in-memory computation with no registration.
 */
export function surfaceTriangleOf(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  point: IAutoMovieVector3,
): number {
  const p: (v: number) => [number, number, number] = (
    v: number,
  ): [number, number, number] => [
    positions[3 * v]!,
    positions[3 * v + 1]!,
    positions[3 * v + 2]!,
  ];
  for (let t: number = 0; t < indices.length / 3; ++t) {
    const a: [number, number, number] = p(indices[3 * t]!);
    const b: [number, number, number] = p(indices[3 * t + 1]!);
    const c: [number, number, number] = p(indices[3 * t + 2]!);
    const ab: number[] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac: number[] = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const ap: number[] = [point.x - a[0], point.y - a[1], point.z - a[2]];
    const n: number[] = [
      ab[1]! * ac[2]! - ab[2]! * ac[1]!,
      ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      ab[0]! * ac[1]! - ab[1]! * ac[0]!,
    ];
    const nn: number = n[0]! ** 2 + n[1]! ** 2 + n[2]! ** 2;
    if (nn === 0) continue;
    const off: number =
      (ap[0]! * n[0]! + ap[1]! * n[1]! + ap[2]! * n[2]!) / Math.sqrt(nn);
    if (Math.abs(off) > 1e-12) continue;
    const area: (u: number[], v: number[]) => number = (
      u: number[],
      v: number[],
    ): number =>
      ((u[1]! * v[2]! - u[2]! * v[1]!) * n[0]! +
        (u[2]! * v[0]! - u[0]! * v[2]!) * n[1]! +
        (u[0]! * v[1]! - u[1]! * v[0]!) * n[2]!) /
      nn;
    const beta: number = area(ap, ac);
    const gamma: number = area(ab, ap);
    if (beta >= -1e-12 && gamma >= -1e-12 && beta + gamma <= 1 + 1e-12)
      return t;
  }
  throw new Error("point lies on no triangle");
}
