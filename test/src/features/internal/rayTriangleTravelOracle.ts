/**
 * Independent ray-plane intersection with triangle barycentric admission.
 * The caller supplies a unit direction and predecoded corner/edge vectors.
 * Scalar triple products solve the three coefficients directly; division by
 * the determinant retains the original oracle arithmetic and 1e-18 parallel
 * threshold. Neither production hierarchy nor its cached triangle records are
 * read. Travel is accepted on the original closed [0, maximum] interval.
 */
export const rayTriangleTravelOracle = (
  origin: readonly number[],
  direction: readonly number[],
  triangle: { a: readonly number[]; ab: readonly number[]; ac: readonly number[] },
  maximum: number,
): number | null => {
  const [nx, ny, nz] = direction;
  const [e1x, e1y, e1z] = triangle.ab;
  const [e2x, e2y, e2z] = triangle.ac;
  const px = ny * e2z - nz * e2y;
  const py = nz * e2x - nx * e2z;
  const pz = nx * e2y - ny * e2x;
  const det = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-18) return null;
  const sx = origin[0] - triangle.a[0];
  const sy = origin[1] - triangle.a[1];
  const sz = origin[2] - triangle.a[2];
  const u = (sx * px + sy * py + sz * pz) / det;
  if (u < 0 || u > 1) return null;
  const qx = sy * e1z - sz * e1y;
  const qy = sz * e1x - sx * e1z;
  const qz = sx * e1y - sy * e1x;
  const v = (nx * qx + ny * qy + nz * qz) / det;
  if (v < 0 || u + v > 1) return null;
  const hit = (e2x * qx + e2y * qy + e2z * qz) / det;
  return hit >= 0 && hit <= maximum ? hit : null;
};
