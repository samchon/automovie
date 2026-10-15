import { ISolid } from "./ISolid";

/** Return the height between upper and lower roof faces under a vertical probe. */

export const occupied = (shape: ISolid, x: number, z: number): readonly [number, number] | null => {
  let low = Infinity;
  let high = -Infinity;
  for (const face of shape.triangles) {
    if (x < face.x[0] || x > face.x[1] || z < face.z[0] || z > face.z[1]) continue;
    const { a, b, c } = face;
    const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(denominator) < 1e-12) continue;
    const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / denominator;
    const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / denominator;
    const w = 1 - u - v;
    if (u < -1e-9 || v < -1e-9 || w < -1e-9) continue;
    const height = u * a.y + v * b.y + w * c.y;
    low = Math.min(low, height);
    high = Math.max(high, height);
  }
  return high - low > 1e-6 ? [low, high] : null;
};
