/**
 * Scalar and vector fields over the neutral body surface, the vocabulary the
 * individuality channels are written in: a tissue mask read off an existing
 * endpoint, a polar coordinate between two boundaries of that mask, a
 * geodesic distance to a seed set or a curve, and the mirror that turns a
 * left endpoint into its right.
 *
 * Every field is evaluated on the neutral mesh once and multiplied into a
 * displacement that is published as sparse rows; nothing here is evaluated
 * at runtime.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { neighboursOf } from "./pushApart";

/** A vertex is the mirror of another when their reflections agree this closely, metres. */
const MIRROR_TOLERANCE = 1e-5;

export type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/** A weight per vertex, zero where the field does not reach. */
export type Field = Float64Array;

export interface IMesh {
  surface: Surface;
  vertices: number;
  near: Set<number>[];
  /** Unit vertex normals of the neutral surface. */
  normals: number[];
  /** The vertex at `(-x, y, z)` of each vertex; the source mesh is an exact involution. */
  mirror: Int32Array;
}

export function meshOf(surface: Surface, normals: number[]): IMesh {
  const vertices = surface.positions.length / 3;
  const near = neighboursOf(surface.indices, vertices);
  const mirror = new Int32Array(vertices).fill(-1);
  const cells = new Map<string, number[]>();
  const cell = (x: number, y: number, z: number): string =>
    [x, y, z].map((one) => Math.round(one / 1e-3)).join(",");
  for (let v = 0; v < vertices; v++) {
    const key = cell(
      surface.positions[v * 3],
      surface.positions[v * 3 + 1],
      surface.positions[v * 3 + 2],
    );
    const list = cells.get(key);
    if (list === undefined) cells.set(key, [v]);
    else list.push(v);
  }
  for (let v = 0; v < vertices; v++) {
    const target = [
      -surface.positions[v * 3],
      surface.positions[v * 3 + 1],
      surface.positions[v * 3 + 2],
    ];
    let best = -1;
    let bestDistance = MIRROR_TOLERANCE;
    for (const dx of [-1, 0, 1])
      for (const dy of [-1, 0, 1])
        for (const dz of [-1, 0, 1]) {
          const key = [
            Math.round(target[0] / 1e-3) + dx,
            Math.round(target[1] / 1e-3) + dy,
            Math.round(target[2] / 1e-3) + dz,
          ].join(",");
          for (const w of cells.get(key) ?? []) {
            const distance = Math.hypot(
              surface.positions[w * 3] - target[0],
              surface.positions[w * 3 + 1] - target[1],
              surface.positions[w * 3 + 2] - target[2],
            );
            if (distance < bestDistance) {
              bestDistance = distance;
              best = w;
            }
          }
        }
    if (best < 0) throw new Error(`vertex ${v} has no mirror`);
    mirror[v] = best;
  }
  return { surface, vertices, near, normals, mirror };
}

export function position(mesh: IMesh, v: number): number[] {
  return [
    mesh.surface.positions[v * 3],
    mesh.surface.positions[v * 3 + 1],
    mesh.surface.positions[v * 3 + 2],
  ];
}

export function normal(mesh: IMesh, v: number): number[] {
  return [
    mesh.normals[v * 3],
    mesh.normals[v * 3 + 1],
    mesh.normals[v * 3 + 2],
  ];
}

/** A Hermite step from 0 at `a` to 1 at `b`. */
export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** A unit bell centred on `centre` with standard deviation `sigma`. */
export function bell(centre: number, sigma: number, x: number): number {
  const u = (x - centre) / sigma;
  return Math.exp(-0.5 * u * u);
}

/**
 * The tissue an endpoint grows, as a weight: each vertex's displacement
 * magnitude under the endpoint over the largest, raised from `floor` to one
 * by a smooth step so the mask ends where the endpoint's own falloff ends.
 * The source authored those falloffs by hand over the region's anatomy,
 * which is exactly the boundary a new trait of the same tissue should share.
 */
export function maskOf(mesh: IMesh, rows: number[], floor: number): Field {
  const field = new Float64Array(mesh.vertices);
  let most = 0;
  for (let at = 0; at < rows.length; at += 4) {
    const size = Math.hypot(rows[at + 1], rows[at + 2], rows[at + 3]);
    field[rows[at]] = size;
    most = Math.max(most, size);
  }
  for (let v = 0; v < mesh.vertices; v++)
    field[v] = smoothstep(floor, Math.min(1, floor * 3), field[v] / most);
  return field;
}

/** Vertices of the mask with a neighbour outside it. */
export function rimOf(mesh: IMesh, mask: Field): number[] {
  const rim: number[] = [];
  for (let v = 0; v < mesh.vertices; v++) {
    if (mask[v] <= 0) continue;
    for (const w of mesh.near[v])
      if (mask[w] <= 0) {
        rim.push(v);
        break;
      }
  }
  return rim;
}

/**
 * Geodesic distance over the mesh edges from a seed set, Dijkstra on the
 * neighbour graph, optionally confined to the vertices `inside` admits.
 * Vertices out of reach keep `Infinity`.
 */
export function geodesic(
  mesh: IMesh,
  seeds: Iterable<number>,
  inside: ((v: number) => boolean) | null,
): Field {
  const distance = new Float64Array(mesh.vertices).fill(Infinity);
  const heap: [number, number][] = [];
  const push = (d: number, v: number): void => {
    heap.push([d, v]);
    let at = heap.length - 1;
    while (at > 0) {
      const up = (at - 1) >> 1;
      if (heap[up][0] <= heap[at][0]) break;
      [heap[up], heap[at]] = [heap[at], heap[up]];
      at = up;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let at = 0;
      for (;;) {
        const left = at * 2 + 1;
        const right = left + 1;
        let least = at;
        if (left < heap.length && heap[left][0] < heap[least][0]) least = left;
        if (right < heap.length && heap[right][0] < heap[least][0])
          least = right;
        if (least === at) break;
        [heap[least], heap[at]] = [heap[at], heap[least]];
        at = least;
      }
    }
    return top;
  };
  for (const seed of seeds) {
    distance[seed] = 0;
    push(0, seed);
  }
  while (heap.length > 0) {
    const [d, v] = pop();
    if (d > distance[v]) continue;
    const p = position(mesh, v);
    for (const w of mesh.near[v]) {
      if (inside !== null && !inside(w)) continue;
      const q = position(mesh, w);
      const next = d + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      if (next < distance[w]) {
        distance[w] = next;
        push(next, w);
      }
    }
  }
  return distance;
}

/**
 * A coordinate from 0 on the `lower` seeds to 1 on the `upper` seeds across
 * the mask, the ratio of the geodesic distances, so a trait can be placed
 * "a third of the way up the buttock" without a height in metres that a
 * taller or shorter macro would move.
 */
export function polar(
  mesh: IMesh,
  mask: Field,
  lower: number[],
  upper: number[],
): Field {
  const inside = (v: number): boolean => mask[v] > 0;
  const fromLower = geodesic(mesh, lower, inside);
  const fromUpper = geodesic(mesh, upper, inside);
  const field = new Float64Array(mesh.vertices);
  for (let v = 0; v < mesh.vertices; v++) {
    if (mask[v] <= 0) continue;
    const a = fromLower[v];
    const b = fromUpper[v];
    field[v] =
      Number.isFinite(a) && Number.isFinite(b) && a + b > 0 ? a / (a + b) : 0;
  }
  return field;
}

/** The rim of a mask split by height: below and above the mask's height centroid. */
export function rimsOf(
  mesh: IMesh,
  mask: Field,
): { lower: number[]; upper: number[] } {
  let sum = 0;
  let weight = 0;
  for (let v = 0; v < mesh.vertices; v++) {
    sum += mask[v] * mesh.surface.positions[v * 3 + 1];
    weight += mask[v];
  }
  const centre = sum / weight;
  const rim = rimOf(mesh, mask);
  return {
    lower: rim.filter((v) => mesh.surface.positions[v * 3 + 1] < centre),
    upper: rim.filter((v) => mesh.surface.positions[v * 3 + 1] >= centre),
  };
}

/**
 * Distance from each vertex to a polyline through the given points, in the
 * ambient space, and the parameter along it; for grooves and ridges drawn
 * on the skin from anatomical points.
 */
export function alongCurve(
  mesh: IMesh,
  points: number[][],
): { distance: Field; along: Field } {
  const distance = new Float64Array(mesh.vertices).fill(Infinity);
  const along = new Float64Array(mesh.vertices);
  const lengths = points.slice(1).map((q, at) => {
    const p = points[at];
    return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  const total = lengths.reduce((sum, one) => sum + one, 0);
  for (let v = 0; v < mesh.vertices; v++) {
    const x = position(mesh, v);
    let travelled = 0;
    for (let s = 0; s + 1 < points.length; s++) {
      const p = points[s];
      const q = points[s + 1];
      const d = [0, 1, 2].map((k) => q[k] - p[k]);
      const size = lengths[s] * lengths[s] || 1;
      const t = Math.min(
        1,
        Math.max(
          0,
          [0, 1, 2].reduce((sum, k) => sum + (x[k] - p[k]) * d[k], 0) / size,
        ),
      );
      const c = [0, 1, 2].map((k) => p[k] + d[k] * t);
      const far = Math.hypot(x[0] - c[0], x[1] - c[1], x[2] - c[2]);
      if (far < distance[v]) {
        distance[v] = far;
        along[v] = (travelled + lengths[s] * t) / (total || 1);
      }
      travelled += lengths[s];
    }
  }
  return { distance, along };
}

/** Laplacian smoothing of a scalar field, `sweeps` times with weight `relax`. */
export function smooth(
  mesh: IMesh,
  field: Field,
  sweeps: number,
  relax: number,
): Field {
  let current = field;
  for (let sweep = 0; sweep < sweeps; sweep++) {
    const next = new Float64Array(mesh.vertices);
    for (let v = 0; v < mesh.vertices; v++) {
      let sum = 0;
      for (const w of mesh.near[v]) sum += current[w];
      const mean = mesh.near[v].size > 0 ? sum / mesh.near[v].size : current[v];
      next[v] = current[v] + relax * (mean - current[v]);
    }
    current = next;
  }
  return current;
}

/**
 * Sparse rows from a displacement map, rounded to the micrometre, without
 * the rows that round to nothing, in ascending vertex order.
 */
export function rowsOf(displacement: Map<number, number[]>): number[] {
  const rows: number[] = [];
  for (const v of [...displacement.keys()].sort((a, b) => a - b)) {
    const d = displacement.get(v)!.map((one) => Math.round(one * 1e6) / 1e6);
    if (d[0] === 0 && d[1] === 0 && d[2] === 0) continue;
    rows.push(v, d[0], d[1], d[2]);
  }
  return rows;
}

/** The same rows reflected across X onto the mirror vertices. */
export function mirrored(mesh: IMesh, rows: number[]): number[] {
  const out = new Map<number, number[]>();
  for (let at = 0; at < rows.length; at += 4)
    out.set(mesh.mirror[rows[at]], [-rows[at + 1], rows[at + 2], rows[at + 3]]);
  return rowsOf(out);
}
