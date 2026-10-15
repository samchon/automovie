/** Signed area of an XZ polygon, m², positive for CCW. */

export const planArea = (polygon: ReadonlyArray<{ x: number; z: number; }>): number => polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;
