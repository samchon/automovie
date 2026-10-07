import type { IHumanSourceSurfaceMesh } from "./structures/IHumanSourceSurfaceMesh.ts";

/**
 * Unit vertex normals made exactly bilaterally symmetric: each vertex takes
 * the sum of its triangles' unnormalized cross products (area weighting), is
 * averaged with its mirror twin's normal reflected in x, and is normalized.
 */
export function computeHumanSourceSymmetricNormals(
  mesh: IHumanSourceSurfaceMesh,
  twin: Int32Array,
): Float64Array {
  const { positions: p, indices } = mesh;
  const n = p.length / 3;
  const raw = new Float64Array(3 * n);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t];
    const b = indices[t + 1];
    const c = indices[t + 2];
    const u = [0, 1, 2].map((k) => p[3 * b + k] - p[3 * a + k]);
    const w = [0, 1, 2].map((k) => p[3 * c + k] - p[3 * a + k]);
    const cross = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    for (const v of [a, b, c])
      for (let k = 0; k < 3; k++) raw[3 * v + k] += cross[k];
  }
  const out = new Float64Array(3 * n);
  for (let v = 0; v < n; v++) {
    const m = twin[v];
    const x = raw[3 * v] - raw[3 * m];
    const y = raw[3 * v + 1] + raw[3 * m + 1];
    const z = raw[3 * v + 2] + raw[3 * m + 2];
    const length = Math.hypot(x, y, z);
    out[3 * v] = x / length;
    out[3 * v + 1] = y / length;
    out[3 * v + 2] = z / length;
  }
  return out;
}
