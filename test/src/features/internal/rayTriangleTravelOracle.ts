

/**
 * Intersect a ray with one triangle by scalar triple products and barycentric admission, using the caller's unit direction and predecoded corner/edge vectors. The original 1e-18 parallel threshold and closed [0,maximum] travel interval are preserved without reading production hierarchy or cached triangle records.
 *
 * This uncached observer shares the production Moller-Trumbore formula family and cutoff, so common algebraic or threshold errors can escape parity. It assumes finite, complete inputs and does not validate them or certify visible geometry.
 *
 * Constant work/storage borrows the arrays read-only and returns a scalar/null, with no retained measurement, host or persistent resource.
 */
export const rayTriangleTravelOracle: (origin: readonly number[], direction: readonly number[], triangle: { a: readonly number[]; ab: readonly number[]; ac: readonly number[]; }, maximum: number) => number | null = (
  origin: readonly number[],
  direction: readonly number[],
  triangle: { a: readonly number[]; ab: readonly number[]; ac: readonly number[] },
  maximum: number,
): number | null => {
  const [nx, ny, nz]: readonly number[] = direction;
  const [e1x, e1y, e1z]: readonly number[] = triangle.ab;
  const [e2x, e2y, e2z]: readonly number[] = triangle.ac;
  const px: number = ny * e2z - nz * e2y;
  const py: number = nz * e2x - nx * e2z;
  const pz: number = nx * e2y - ny * e2x;
  const det: number = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-18) return null;
  const sx: number = origin[0] - triangle.a[0];
  const sy: number = origin[1] - triangle.a[1];
  const sz: number = origin[2] - triangle.a[2];
  const u: number = (sx * px + sy * py + sz * pz) / det;
  if (u < 0 || u > 1) return null;
  const qx: number = sy * e1z - sz * e1y;
  const qy: number = sz * e1x - sx * e1z;
  const qz: number = sx * e1y - sy * e1x;
  const v: number = (nx * qx + ny * qy + nz * qz) / det;
  if (v < 0 || u + v > 1) return null;
  const hit: number = (e2x * qx + e2y * qy + e2z * qz) / det;
  return hit >= 0 && hit <= maximum ? hit : null;
};
