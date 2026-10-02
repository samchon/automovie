import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Index a resident mesh for repeated ray queries. `nearest` gives the
 * distance along the ray to its first triangle, in the mesh-local metre frame
 * and measured along the unit direction, or null when none lies within
 * `maximum`; `blocked` answers only whether one does, and stops at the first.
 * `nearestHit` also returns the original triangle ordinal, before BVH sorting.
 * Equal travel selects the lowest ordinal for that metadata; the distance keeps
 * the same raw value as `nearest`, including the sign of zero. Returned records
 * are independent of later queries and can be retained or changed by callers.
 * Both skip hits closer than `minimum` (default zero), so a ray leaving a
 * surface can ignore the triangle it starts on. Triangle winding does not
 * matter; a ray grazing a triangle's plane finds no isolated intersection and
 * passes it; an edge belongs to both its triangles. Input meshes are
 * snapshotted; queries never depend on later caller mutations. The index is a
 * bounding volume hierarchy: each node splits its triangles at the median of
 * their centroids along the axis their centroids spread furthest, down to four
 * a leaf.
 * Normal finite direction norms retain the original division arithmetic.
 * An overflowing or subnormal norm instead scales components by their largest
 * absolute value before normalization: one scaled component has magnitude one
 * and their norm lies in [1,sqrt(3)]. Binary64's smallest normal, 2^-1022, marks
 * a representation regime, not an admitted direction range or tolerance.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Resolves visibility along rays from existing resident triangles so a dependent surface fact can follow its host geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Queries a mesh without changing topology or attributes and retains the caller's metric coordinate frame.
 * @author Samchon
 */
export function createAutoMovieMeshRayCaster(mesh: IAutoMovieMesh): {
  nearest: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
  ) => number | null;
  /** Owned nearest travel and original index-triplet identity, or no hit. */
  nearestHit: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
  ) => { distance: number; triangle: number } | null;
  blocked: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
  ) => boolean;
} {
  const indices =
    mesh.indices ??
    Array.from({ length: mesh.positions.length / 3 }, (_v, i) => i);
  if (
    mesh.positions.length % 3 !== 0 ||
    indices.length % 3 !== 0 ||
    !mesh.positions.every(Number.isFinite) ||
    indices.some(
      (index) =>
        !Number.isInteger(index) ||
        index < 0 ||
        index >= mesh.positions.length / 3,
    )
  )
    throw new Error("Ray casting needs finite complete triangle buffers.");
  const count = indices.length / 3;
  // Triangle corners, flat: a, b, c for each triangle.
  const corner = new Float64Array(9 * count);
  for (let t = 0; t < count; ++t)
    for (let k = 0; k < 3; ++k)
      for (let axis = 0; axis < 3; ++axis)
        corner[9 * t + 3 * k + axis] =
          mesh.positions[3 * indices[3 * t + k] + axis];
  const order = new Int32Array(count);
  for (let t = 0; t < count; ++t) order[t] = t;
  const centroid = (t: number, axis: number) =>
    (corner[9 * t + axis] +
      corner[9 * t + 3 + axis] +
      corner[9 * t + 6 + axis]) /
    3;
  // Nodes: bounds (6 per node), then either two children or a leaf's span
  // of `order`.
  const bounds: number[] = [];
  const left: number[] = [];
  const right: number[] = [];
  const start: number[] = [];
  const size: number[] = [];
  const build = (from: number, to: number): number => {
    const node = left.length;
    const low = [Infinity, Infinity, Infinity];
    const high = [-Infinity, -Infinity, -Infinity];
    const clow = [Infinity, Infinity, Infinity];
    const chigh = [-Infinity, -Infinity, -Infinity];
    for (let i = from; i < to; ++i) {
      const t = order[i];
      for (let axis = 0; axis < 3; ++axis) {
        for (let k = 0; k < 3; ++k) {
          const value = corner[9 * t + 3 * k + axis];
          if (value < low[axis]) low[axis] = value;
          if (value > high[axis]) high[axis] = value;
        }
        const c = centroid(t, axis);
        if (c < clow[axis]) clow[axis] = c;
        if (c > chigh[axis]) chigh[axis] = c;
      }
    }
    bounds.push(...low, ...high);
    left.push(-1);
    right.push(-1);
    start.push(from);
    size.push(to - from);
    const spread = [0, 1, 2].map((axis) => chigh[axis] - clow[axis]);
    const axis = spread.indexOf(Math.max(...spread));
    if (to - from <= 4 || !(spread[axis] > 0)) return node;
    const span = Array.from(order.subarray(from, to)).sort(
      (a, b) => centroid(a, axis) - centroid(b, axis),
    );
    order.set(span, from);
    const middle = from + ((to - from) >> 1);
    left[node] = build(from, middle);
    right[node] = build(middle, to);
    size[node] = 0;
    return node;
  };
  if (count > 0) build(0, count);
  const box = new Float64Array(bounds);
  const leftChild = Int32Array.from(left);
  const rightChild = Int32Array.from(right);
  const first = Int32Array.from(start);
  const span = Int32Array.from(size);
  // Each triangle's first corner and two edges, in `order`'s sequence.
  const edge = new Float64Array(9 * count);
  for (let i = 0; i < count; ++i) {
    const c = 9 * order[i];
    for (let axis = 0; axis < 3; ++axis) {
      edge[9 * i + axis] = corner[c + axis];
      edge[9 * i + 3 + axis] = corner[c + 3 + axis] - corner[c + axis];
      edge[9 * i + 6 + axis] = corner[c + 6 + axis] - corner[c + axis];
    }
  }
  const stack = new Int32Array(Math.max(64, 2 * left.length));
  const cast = (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum: number,
    any: boolean,
  ): { distance: number; triangle: number } | null => {
    const length = Math.hypot(direction[0], direction[1], direction[2]);
    if (
      origin.length !== 3 ||
      direction.length !== 3 ||
      !origin.every(Number.isFinite) ||
      !direction.every(Number.isFinite) ||
      !(length > 0) ||
      !(maximum >= 0) ||
      !(minimum >= 0) ||
      !(minimum <= maximum)
    )
      throw new Error(
        "A ray needs a finite origin, a nonzero direction and 0 <= minimum <= maximum.",
      );
    if (count === 0) return null;
    const ox = origin[0];
    const oy = origin[1];
    const oz = origin[2];
    let dx = direction[0] / length;
    let dy = direction[1] / length;
    let dz = direction[2] / length;
    if (!Number.isFinite(length) || length < 2 ** -1022) {
      const scale = Math.max(Math.abs(direction[0]), Math.abs(direction[1]), Math.abs(direction[2]));
      const x = direction[0] / scale;
      const y = direction[1] / scale;
      const z = direction[2] / scale;
      const scaledLength = Math.hypot(x, y, z);
      dx = x / scaledLength;
      dy = y / scaledLength;
      dz = z / scaledLength;
    }
    const ix = 1 / dx;
    const iy = 1 / dy;
    const iz = 1 / dz;
    let best = maximum;
    let bestTriangle = Infinity;
    let found = false;
    let top = 0;
    stack[top++] = 0;
    while (top > 0) {
      const node = stack[--top];
      const b = 6 * node;
      // Slab test; a zero direction component leaves its slab unbounded
      // when the origin lies within it and empty otherwise.
      let t0 = minimum;
      let t1 = best;
      if (dx === 0) {
        if (ox < box[b] || ox > box[b + 3]) continue;
      } else {
        let a = (box[b] - ox) * ix;
        let c = (box[b + 3] - ox) * ix;
        if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
      }
      if (dy === 0) {
        if (oy < box[b + 1] || oy > box[b + 4]) continue;
      } else {
        let a = (box[b + 1] - oy) * iy;
        let c = (box[b + 4] - oy) * iy;
        if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
      }
      if (dz === 0) {
        if (oz < box[b + 2] || oz > box[b + 5]) continue;
      } else {
        let a = (box[b + 2] - oz) * iz;
        let c = (box[b + 5] - oz) * iz;
        if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a;
        if (c < t1) t1 = c;
      }
      if (t0 > t1) continue;
      if (leftChild[node] >= 0) {
        stack[top++] = leftChild[node];
        stack[top++] = rightChild[node];
        continue;
      }
      const end = first[node] + span[node];
      for (let i = first[node]; i < end; ++i) {
        const c = 9 * i;
        const e1x = edge[c + 3];
        const e1y = edge[c + 4];
        const e1z = edge[c + 5];
        const e2x = edge[c + 6];
        const e2y = edge[c + 7];
        const e2z = edge[c + 8];
        const px = dy * e2z - dz * e2y;
        const py = dz * e2x - dx * e2z;
        const pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (det > -1e-18 && det < 1e-18) continue;
        const inv = 1 / det;
        const sx = ox - edge[c];
        const sy = oy - edge[c + 1];
        const sz = oz - edge[c + 2];
        const u = (sx * px + sy * py + sz * pz) * inv;
        if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y;
        const qy = sz * e1x - sx * e1z;
        const qz = sx * e1y - sy * e1x;
        const v = (dx * qx + dy * qy + dz * qz) * inv;
        if (v < 0 || u + v > 1) continue;
        const hit = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (hit < minimum || hit > best) continue;
        // Edges belong to every incident triangle. Metadata uses original
        // identity rather than traversal order; legacy distance assignment
        // still visits every admitted equal hit and preserves its raw zero.
        if (hit < best) bestTriangle = order[i];
        else bestTriangle = Math.min(bestTriangle, order[i]);
        best = hit;
        found = true;
        if (any) return { distance: best, triangle: bestTriangle };
      }
    }
    return found ? { distance: best, triangle: bestTriangle } : null;
  };
  return {
    nearest: (origin, direction, maximum, minimum = 0) =>
      cast(origin, direction, maximum, minimum, false)?.distance ?? null,
    nearestHit: (origin, direction, maximum, minimum = 0) =>
      cast(origin, direction, maximum, minimum, false),
    blocked: (origin, direction, maximum, minimum = 0) =>
      cast(origin, direction, maximum, minimum, true) !== null,
  };
}
