import type { IHumanSourceTriangleHit } from "./structures/IHumanSourceTriangleHit.ts";

/** Grid cell edge for the triangle search, metres. */
const CELL = 0.01;

/**
 * Build an exact nearest-triangle query over a subset of a mesh's triangles.
 * Triangles are bucketed by their bounding boxes on a uniform grid; a query
 * grows its search shell until no unvisited cell can hold a nearer point, so
 * the answer equals a brute-force search. The closest point on each candidate
 * uses the region classification of Ericson, Real-Time Collision Detection
 * §5.1.5, and reports its barycentric weights.
 */
export function closestHumanSourceTriangle(
  positions: readonly number[],
  triangles: readonly number[],
  subset: readonly number[],
): (point: readonly number[]) => IHumanSourceTriangleHit {
  const cells = new Map<string, number[]>();
  const key = (x: number, y: number, z: number): string => `${x}/${y}/${z}`;
  const corner = (t: number, k: number): number[] => {
    const g = triangles[3 * t + k];
    return [positions[3 * g], positions[3 * g + 1], positions[3 * g + 2]];
  };
  for (const t of subset) {
    const ps = [0, 1, 2].map((k) => corner(t, k));
    const lo = [0, 1, 2].map((c) =>
      Math.floor(Math.min(...ps.map((p) => p[c])) / CELL),
    );
    const hi = [0, 1, 2].map((c) =>
      Math.floor(Math.max(...ps.map((p) => p[c])) / CELL),
    );
    for (let x = lo[0]; x <= hi[0]; x++)
      for (let y = lo[1]; y <= hi[1]; y++)
        for (let z = lo[2]; z <= hi[2]; z++) {
          const k = key(x, y, z);
          const list = cells.get(k);
          if (list === undefined) cells.set(k, [t]);
          else list.push(t);
        }
  }
  const closest = (
    p: readonly number[],
    a: number[],
    b: number[],
    c: number[],
  ): number[] => {
    const sub = (u: readonly number[], w: readonly number[]): number[] => [
      u[0] - w[0],
      u[1] - w[1],
      u[2] - w[2],
    ];
    const dot = (u: number[], w: number[]): number =>
      u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
    const ab = sub(b, a),
      ac = sub(c, a),
      ap = sub(p, a);
    const d1 = dot(ab, ap),
      d2 = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return [1, 0, 0];
    const bp = sub(p, b),
      d3 = dot(ab, bp),
      d4 = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return [0, 1, 0];
    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);
      return [1 - v, v, 0];
    }
    const cp = sub(p, c),
      d5 = dot(ab, cp),
      d6 = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return [0, 0, 1];
    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);
      return [1 - w, 0, w];
    }
    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
      return [0, 1 - w, w];
    }
    const denom = 1 / (va + vb + vc);
    const v = vb * denom,
      w = vc * denom;
    return [1 - v - w, v, w];
  };
  return (point) => {
    const centre = [0, 1, 2].map((c) => Math.floor(point[c] / CELL));
    let best: IHumanSourceTriangleHit = {
      triangle: -1,
      weights: [0, 0, 0],
      distance: Number.POSITIVE_INFINITY,
    };
    const seen = new Set<number>();
    for (let shell = 0; shell < 1000; shell++) {
      // Every point outside the visited cube lies at least (shell) cells away.
      if (best.triangle >= 0 && best.distance <= Math.max(0, shell - 1) * CELL)
        break;
      for (let x = -shell; x <= shell; x++)
        for (let y = -shell; y <= shell; y++)
          for (let z = -shell; z <= shell; z++) {
            if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) !== shell)
              continue;
            for (const t of cells.get(
              key(centre[0] + x, centre[1] + y, centre[2] + z),
            ) ?? []) {
              if (seen.has(t)) continue;
              seen.add(t);
              const ps = [0, 1, 2].map((k) => corner(t, k));
              const w = closest(point, ps[0], ps[1], ps[2]);
              const q = [0, 1, 2].map(
                (c) => w[0] * ps[0][c] + w[1] * ps[1][c] + w[2] * ps[2][c],
              );
              const d = Math.hypot(
                q[0] - point[0],
                q[1] - point[1],
                q[2] - point[2],
              );
              if (d < best.distance)
                best = { triangle: t, weights: w, distance: d };
            }
          }
    }
    if (best.triangle < 0)
      throw new Error("No triangle lies near the query point.");
    return best;
  };
}
