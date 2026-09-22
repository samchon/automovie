/**
 * The geometry under `pushApart`: the neighbour graph of the mesh, the
 * nearest-surface query over a segment's triangles in a uniform grid, the
 * compact mesh a segment is handed to the crossing instrument as, and the
 * crossed corners of one segment against another.
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/** The neighbours of each vertex, over the whole mesh. */
export function neighboursOf(
  indices: number[],
  vertices: number,
): Set<number>[] {
  const near: Set<number>[] = [...new Array(vertices)].map(
    () => new Set<number>(),
  );
  for (let at = 0; at + 2 < indices.length; at += 3)
    for (let corner = 0; corner < 3; corner++) {
      const here = indices[at + corner];
      near[here].add(indices[at + ((corner + 1) % 3)]);
      near[here].add(indices[at + ((corner + 2) % 3)]);
    }
  return near;
}

/** Closest point to `point` inside triangle `abc`, by Ericson's region test. */
function closestInTriangle(
  point: number[],
  a: number[],
  b: number[],
  c: number[],
): number[] {
  const sub = (x: number[], y: number[]) => [
    x[0] - y[0],
    x[1] - y[1],
    x[2] - y[2],
  ];
  const dot = (x: number[], y: number[]) =>
    x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const mix = (x: number[], y: number[], t: number) =>
    [0, 1, 2].map((k) => x[k] + (y[k] - x[k]) * t);
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(point, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(point, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return mix(a, b, d1 / (d1 - d3));
  const cp = sub(point, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return mix(a, c, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return mix(b, c, (d4 - d3) / (d4 - d3 + (d5 - d6)));
  const denominator = va + vb + vc;
  return [0, 1, 2].map(
    (k) => a[k] + (ab[k] * vb) / denominator + (ac[k] * vc) / denominator,
  );
}

/**
 * A segment's triangles in a uniform grid with their planes, for nearest
 * surface queries: the nearest point on the nearest triangle, that triangle's
 * outward normal, and the signed distance of the query along it.
 */
export function surfaceOf(positions: number[], triangles: number[]) {
  const corners: number[][][] = [];
  const planes: number[][] = [];
  let span = 0;
  for (let at = 0; at + 2 < triangles.length; at += 3) {
    const triangle = [0, 1, 2].map((corner) =>
      [0, 1, 2].map((k) => positions[triangles[at + corner] * 3 + k]),
    );
    corners.push(triangle);
    const u = [0, 1, 2].map((k) => triangle[1][k] - triangle[0][k]);
    const v = [0, 1, 2].map((k) => triangle[2][k] - triangle[0][k]);
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const size = Math.hypot(cross[0], cross[1], cross[2]);
    planes.push(size > 0 ? cross.map((one) => one / size) : [0, 0, 1]);
    span += Math.max(
      ...[0, 1, 2].map(
        (k) =>
          Math.max(triangle[0][k], triangle[1][k], triangle[2][k]) -
          Math.min(triangle[0][k], triangle[1][k], triangle[2][k]),
      ),
    );
  }
  const cell = Math.max(span / Math.max(corners.length, 1), 1e-6);
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const of = (point: number[]) =>
    point.map((one) => Math.floor(one / cell)) as [number, number, number];
  const grid = new Map<string, number[]>();
  for (const [index, triangle] of corners.entries()) {
    const low = of(
      [0, 1, 2].map((k) => Math.min(...triangle.map((p) => p[k]))),
    );
    const high = of(
      [0, 1, 2].map((k) => Math.max(...triangle.map((p) => p[k]))),
    );
    for (let x = low[0]; x <= high[0]; x++)
      for (let y = low[1]; y <= high[1]; y++)
        for (let z = low[2]; z <= high[2]; z++) {
          const at = key(x, y, z);
          const bucket = grid.get(at);
          if (bucket === undefined) grid.set(at, [index]);
          else bucket.push(index);
        }
  }
  return (
    point: number[],
  ): { at: number[]; normal: number[]; away: number } => {
    const middle = of(point);
    let best = 0;
    let bestPoint = corners[0][0];
    let nearest = Infinity;
    for (let reach = 1; reach <= 12; reach++) {
      for (let x = middle[0] - reach; x <= middle[0] + reach; x++)
        for (let y = middle[1] - reach; y <= middle[1] + reach; y++)
          for (let z = middle[2] - reach; z <= middle[2] + reach; z++)
            for (const index of grid.get(key(x, y, z)) ?? []) {
              const [a, b, c] = corners[index];
              const on = closestInTriangle(point, a, b, c);
              const apart =
                (on[0] - point[0]) ** 2 +
                (on[1] - point[1]) ** 2 +
                (on[2] - point[2]) ** 2;
              if (apart < nearest) {
                nearest = apart;
                best = index;
                bestPoint = on;
              }
            }
      if (nearest < Infinity && Math.sqrt(nearest) < cell * (reach - 1)) break;
    }
    const normal = planes[best];
    return {
      at: bestPoint,
      normal,
      away: [0, 1, 2].reduce(
        (total, k) => total + (point[k] - bestPoint[k]) * normal[k],
        0,
      ),
    };
  };
}

/** A segment as a compact mesh over the current positions. */
export function meshOf(
  positions: number[],
  triangles: number[],
): IAutoMovieMesh {
  const local = new Map<number, number>();
  const out: number[] = [];
  const indices = triangles.map((vertex) => {
    let index = local.get(vertex);
    if (index === undefined) {
      index = local.size;
      local.set(vertex, index);
      out.push(
        positions[vertex * 3],
        positions[vertex * 3 + 1],
        positions[vertex * 3 + 2],
      );
    }
    return index;
  });
  return { positions: out, normals: null, indices, uvs: null, skin: null };
}

/** Basis vertices of `mine` triangles that cross `theirs`. */
export function crossedVertices(
  positions: number[],
  mine: number[],
  theirs: number[],
): Set<number> {
  const hit = new Set<number>();
  for (const crossing of measureAutoMovieMeshCrossings(
    meshOf(positions, mine),
    meshOf(positions, theirs),
  ))
    for (let corner = 0; corner < 3; corner++)
      hit.add(mine[crossing.triangle * 3 + corner]);
  return hit;
}
