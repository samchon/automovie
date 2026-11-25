import type {
  IAutoMovieMesh,
  IAutoMovieMeshRayCaster,
  IAutoMovieMeshRayHit,
  IAutoMovieMeshRayQueryOptions,
} from "@automovie/interface";

import { triangleIndicesOf } from "./triangleIndicesOf";
import { overflowsBinary64 } from "../math/overflowsBinary64";

/**
 * Index a resident mesh for repeated ray queries.
 *
 * The mesh is copied into typed arrays at creation, so later caller mutations
 * never change an answer. The index is a bounding volume hierarchy: each node
 * splits its triangles at the median of their centroids along the axis the
 * centroids spread furthest, down to four triangles a leaf. `nearest` returns
 * the travel to the first triangle in metres along the normalized direction, or
 * null; `nearestHit` also returns that triangle's original ordinal, the lowest
 * one among equal travels, with the same raw travel including the sign of zero;
 * `blocked` answers only whether any triangle lies in range and stops at the
 * first. Returned records are new per query.
 *
 * A hit counts when its travel lies in `[minimum, maximum]`, minimum defaulting
 * to zero so a ray leaving a surface can skip the triangle it starts on, and
 * positive infinity meaning no maximum. A query may exclude original triangle
 * ordinals, such as the faces around its own attachment vertex; that changes
 * which triangles are targets, never the origin or a band of near hits. Winding
 * does not matter, an edge belongs to both its triangles, and a ray whose
 * Moller-Trumbore determinant is within 1e-18 of zero is treated as parallel to
 * that triangle and passes it. A missing hit is an observation gap, not proof
 * that the origin is inside or outside anything.
 *
 * Finite coordinates do not guarantee representable intermediate arithmetic.
 * Creation throws on a malformed index buffer, a non-finite position or an
 * unrepresentable edge; a query throws, naming the triangle where one is
 * involved, on unrepresentable box, determinant, barycentric or travel
 * arithmetic instead of producing a NaN hit. Centroids whose sum overflows are
 * averaged after scaling by their largest magnitude, a direction whose norm
 * overflows or is subnormal is normalized after the same scaling, and a
 * subnormal direction component whose reciprocal is infinite uses direct slab
 * division; ordinary inputs keep plain arithmetic.
 *
 * @param mesh Resident surface, snapshotted.
 * @returns The three ray queries over one shared index.
 */
export function createAutoMovieMeshRayCaster(
  mesh: IAutoMovieMesh,
): IAutoMovieMeshRayCaster {
  const indices: number[] = triangleIndicesOf(
    mesh,
    "Ray casting (complete triangle buffers)",
  );
  const count: number = indices.length / 3;
  const tree: IRayHierarchy = buildRayHierarchy(mesh.positions, indices);
  const { box, leftChild, rightChild, first, span, order, edge } = tree;
  const stack: Int32Array = new Int32Array(Math.max(64, 2 * leftChild.length));
  const cast = (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum: number | undefined,
    any: boolean,
    options?: IAutoMovieMeshRayQueryOptions,
  ): IAutoMovieMeshRayHit | null => {
    const minimumTravel: number = minimum === undefined ? 0 : minimum;
    const length: number = Math.hypot(
      direction[0]!,
      direction[1]!,
      direction[2]!,
    );
    if (
      origin.length !== 3 ||
      direction.length !== 3 ||
      !(length > 0) ||
      !(maximum >= 0) ||
      !(minimumTravel >= 0) ||
      !(minimumTravel <= maximum)
    )
      throw new Error(
        "A ray needs a finite origin, a nonzero direction and 0 <= minimum <= maximum.",
      );
    const excluded: ReadonlySet<number> | undefined =
      options?.excludedTriangles;
    if (excluded !== undefined)
      for (const triangle of excluded)
        if (triangle < 0 || triangle >= count)
          throw new Error(
            "Ray exclusions must address original triangles of this mesh.",
          );
    if (count === 0) return null;
    const ox: number = origin[0]!;
    const oy: number = origin[1]!;
    const oz: number = origin[2]!;
    let dx: number = direction[0]! / length;
    let dy: number = direction[1]! / length;
    let dz: number = direction[2]! / length;
    if (overflowsBinary64(length) || length < 2 ** -1022) {
      // Binary64's smallest normal marks a representation regime, not an
      // admitted direction range: scale so one component has magnitude one.
      const scale: number = Math.max(
        Math.abs(direction[0]!),
        Math.abs(direction[1]!),
        Math.abs(direction[2]!),
      );
      const x: number = direction[0]! / scale;
      const y: number = direction[1]! / scale;
      const z: number = direction[2]! / scale;
      const scaledLength: number = Math.hypot(x, y, z);
      dx = x / scaledLength;
      dy = y / scaledLength;
      dz = z / scaledLength;
    }
    const ix: number = 1 / dx;
    const iy: number = 1 / dy;
    const iz: number = 1 / dz;
    let best: number = maximum;
    let bestTriangle: number = Infinity;
    let found: boolean = false;
    let top: number = 0;
    stack[top++] = 0;
    while (top > 0) {
      const node: number = stack[--top]!;
      const b: number = 6 * node;
      // Slab test; a zero direction component leaves its slab unbounded
      // when the origin lies within it and empty otherwise.
      let t0: number = minimumTravel;
      let t1: number = best;
      if (dx === 0) {
        if (ox < box[b]! || ox > box[b + 3]!) continue;
      } else {
        let a: number = slabTravel(box[b]!, ox, ix, dx);
        let c: number = slabTravel(box[b + 3]!, ox, ix, dx);
        if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
      }
      if (dy === 0) {
        if (oy < box[b + 1]! || oy > box[b + 4]!) continue;
      } else {
        let a: number = slabTravel(box[b + 1]!, oy, iy, dy);
        let c: number = slabTravel(box[b + 4]!, oy, iy, dy);
        if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
      }
      if (dz === 0) {
        if (oz < box[b + 2]! || oz > box[b + 5]!) continue;
      } else {
        let a: number = slabTravel(box[b + 2]!, oz, iz, dz);
        let c: number = slabTravel(box[b + 5]!, oz, iz, dz);
        if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
      }
      if (t0 > t1) continue;
      if (leftChild[node]! >= 0) {
        stack[top++] = leftChild[node]!;
        stack[top++] = rightChild[node]!;
        continue;
      }
      const end: number = first[node]! + span[node]!;
      for (let i: number = first[node]!; i < end; ++i) {
        const ordinal: number = order[i]!;
        if (excluded?.has(ordinal)) continue;
        const c: number = 9 * i;
        const e1x: number = edge[c + 3]!;
        const e1y: number = edge[c + 4]!;
        const e1z: number = edge[c + 5]!;
        const e2x: number = edge[c + 6]!;
        const e2y: number = edge[c + 7]!;
        const e2z: number = edge[c + 8]!;
        const px: number = dy * e2z - dz * e2y;
        const py: number = dz * e2x - dx * e2z;
        const pz: number = dx * e2y - dy * e2x;
        const det: number = e1x * px + e1y * py + e1z * pz;
        if (det > -1e-18 && det < 1e-18) continue;
        const inv: number = 1 / det;
        const sx: number = ox - edge[c]!;
        const sy: number = oy - edge[c + 1]!;
        const sz: number = oz - edge[c + 2]!;
        const u: number = (sx * px + sy * py + sz * pz) * inv;
        if (u < 0 || u > 1) continue;
        const qx: number = sy * e1z - sz * e1y;
        const qy: number = sz * e1x - sx * e1z;
        const qz: number = sx * e1y - sy * e1x;
        const v: number = (dx * qx + dy * qy + dz * qz) * inv;
        if (v < 0 || u + v > 1) continue;
        const hit: number = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (hit < minimumTravel || hit > best) continue;
        // Every admitted equal hit is visited, so the attributed triangle is
        // the lowest original ordinal and `best` keeps the raw computed zero.
        if (hit < best) bestTriangle = ordinal;
        else bestTriangle = Math.min(bestTriangle, ordinal);
        best = hit;
        found = true;
        if (any) return { distance: best, triangle: bestTriangle };
      }
    }
    return found ? { distance: best, triangle: bestTriangle } : null;
  };
  return {
    nearest: (
      origin: readonly number[],
      direction: readonly number[],
      maximum: number,
      minimum?: number,
      options?: IAutoMovieMeshRayQueryOptions,
    ): number | null =>
      cast(origin, direction, maximum, minimum, false, options)?.distance ??
      null,
    nearestHit: (
      origin: readonly number[],
      direction: readonly number[],
      maximum: number,
      minimum?: number,
      options?: IAutoMovieMeshRayQueryOptions,
    ): IAutoMovieMeshRayHit | null =>
      cast(origin, direction, maximum, minimum, false, options),
    blocked: (
      origin: readonly number[],
      direction: readonly number[],
      maximum: number,
      minimum?: number,
      options?: IAutoMovieMeshRayQueryOptions,
    ): boolean =>
      cast(origin, direction, maximum, minimum, true, options) !== null,
  };
}

/** The flat hierarchy and edge table the ray queries read. */
interface IRayHierarchy {
  /** Six bounds per node: XYZ minimum, then XYZ maximum. */
  box: Float64Array;

  /** Left child per node, or -1 for a leaf. */
  leftChild: Int32Array;

  /** Right child per node, or -1 for a leaf. */
  rightChild: Int32Array;

  /** First position in `order` of a leaf's triangles. */
  first: Int32Array;

  /** Number of a leaf's triangles; zero for an interior node. */
  span: Int32Array;

  /** Original triangle ordinal at each traversal position. */
  order: Int32Array;

  /** First corner and two edges, nine values per traversal position. */
  edge: Float64Array;
}

/**
 * Build the median-split hierarchy and the per-triangle edge table.
 *
 * Kept outside the caster's closure so the corner table and the growable
 * construction lists become garbage once the typed results exist.
 */
const buildRayHierarchy = (
  positions: readonly number[],
  indices: readonly number[],
): IRayHierarchy => {
  const count: number = indices.length / 3;
  // Triangle corners, flat: a, b, c for each triangle.
  const corner: Float64Array = new Float64Array(9 * count);
  for (let t: number = 0; t < count; ++t)
    for (let k: number = 0; k < 3; ++k)
      for (let axis: number = 0; axis < 3; ++axis)
        corner[9 * t + 3 * k + axis] =
          positions[3 * indices[3 * t + k]! + axis]!;
  const order: Int32Array = new Int32Array(count);
  for (let t: number = 0; t < count; ++t) order[t] = t;
  const bounds: number[] = [];
  const left: number[] = [];
  const right: number[] = [];
  const start: number[] = [];
  const size: number[] = [];
  const build = (from: number, to: number): number => {
    const node: number = left.length;
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    const clow: number[] = [Infinity, Infinity, Infinity];
    const chigh: number[] = [-Infinity, -Infinity, -Infinity];
    for (let i: number = from; i < to; ++i) {
      const t: number = order[i]!;
      for (let axis: number = 0; axis < 3; ++axis) {
        for (let k: number = 0; k < 3; ++k) {
          const value: number = corner[9 * t + 3 * k + axis]!;
          if (value < low[axis]!) low[axis] = value;
          if (value > high[axis]!) high[axis] = value;
        }
        const c: number = centroid(corner, t, axis);
        if (c < clow[axis]!) clow[axis] = c;
        if (c > chigh[axis]!) chigh[axis] = c;
      }
    }
    bounds.push(...low, ...high);
    left.push(-1);
    right.push(-1);
    start.push(from);
    size.push(to - from);
    let axis: number = 0;
    for (let candidate: number = 1; candidate < 3; candidate++)
      if (chigh[candidate]! - clow[candidate]! > chigh[axis]! - clow[axis]!)
        axis = candidate;
    if (to - from <= 4 || !(chigh[axis]! - clow[axis]! > 0)) return node;
    const sorted: number[] = Array.from(order.subarray(from, to)).sort(
      (a: number, b: number): number =>
        centroid(corner, a, axis) - centroid(corner, b, axis),
    );
    order.set(sorted, from);
    const middle: number = from + ((to - from) >> 1);
    left[node] = build(from, middle);
    right[node] = build(middle, to);
    size[node] = 0;
    return node;
  };
  if (count > 0) build(0, count);
  const edge: Float64Array = new Float64Array(9 * count);
  for (let i: number = 0; i < count; ++i) {
    const c: number = 9 * order[i]!;
    for (let axis: number = 0; axis < 3; ++axis) {
      edge[9 * i + axis] = corner[c + axis]!;
      edge[9 * i + 3 + axis] = corner[c + 3 + axis]! - corner[c + axis]!;
      edge[9 * i + 6 + axis] = corner[c + 6 + axis]! - corner[c + axis]!;
    }
  }
  return {
    box: new Float64Array(bounds),
    leftChild: Int32Array.from(left),
    rightChild: Int32Array.from(right),
    first: Int32Array.from(start),
    span: Int32Array.from(size),
    order,
    edge,
  };
};

/**
 * One triangle's centroid coordinate on one axis. A mean of finite values stays
 * bounded by them even when their plain sum overflows, so an overflowing sum is
 * averaged after scaling by the largest magnitude.
 */
const centroid = (corner: Float64Array, t: number, axis: number): number => {
  const a: number = corner[9 * t + axis]!;
  const b: number = corner[9 * t + 3 + axis]!;
  const c: number = corner[9 * t + 6 + axis]!;
  const scale: number = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  // Coordinates past a third of the largest double can overflow their sum.
  if (scale <= Number.MAX_VALUE / 3) return (a + b + c) / 3;
  return ((a / scale + b / scale + c / scale) / 3) * scale;
};

/**
 * Travel along one axis from a coordinate to a box bound. A subnormal nonzero
 * direction component can have an infinite reciprocal while the quotient is
 * finite, so that case divides directly instead of multiplying.
 */
const slabTravel = (
  bound: number,
  coordinate: number,
  inverse: number,
  component: number,
): number => {
  const delta: number = bound - coordinate;
  // A zero component leaves no travel to a slab its origin lies on.
  if (delta === 0 && component === 0)
    throw new Error("Ray box travel is indeterminate.");
  // A subnormal component overflows its reciprocal; divide directly then.
  return inverse === Infinity || inverse === -Infinity
    ? delta / component
    : delta * inverse;
};
