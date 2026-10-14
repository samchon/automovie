import type { IAutoMovieMesh } from "@automovie/interface";

import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Index a resident mesh for repeated axis-aligned depth queries.
 *
 * The returned sampler takes a point `(u, v)` in the plane perpendicular to
 * `axis` and answers the smallest and largest depth along `axis` at which a
 * triangle covers it, or `null` when none does. The query plane is Y/Z for
 * depth X, Z/X for depth Y and X/Y for depth Z, in the mesh-local metre frame.
 * An open surface may return equal depths, winding does not matter, and a
 * point on a shared edge belongs to both neighbours. A triangle whose
 * projection has zero area, one parallel to the query axis, is skipped, so the
 * sampler reports a surface envelope and not a closed-volume test.
 *
 * The mesh is copied into the index at creation, so later caller mutations
 * never change an answer. Creation throws on an invalid axis, a malformed
 * index buffer, a non-finite position, or projected area or extent arithmetic
 * that overflows; a query throws on a non-finite coordinate or depth.
 *
 * @param mesh Resident surface, snapshotted.
 * @param axis Depth axis.
 * @returns The depth query.
 *
 * @evidence contracts/common.md#principled-implementation Barycentric point-in-triangle tests on the projected triangles with depth interpolated by the same weights, which is exact for planar triangles; the index is a uniform 32 by 32 grid over the projected extent, each triangle registered in every cell its projected box touches, so a query point's cell holds every triangle that can cover it.
 * @evidence contracts/common.md#clear-and-simple-design Index admission is delegated to `triangleIndicesOf`; this function owns only the projection, the grid and the envelope query, returned as a closure over the snapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-10 barycentric slack only keeps shared edges inside both neighbours and never lets a point far outside a triangle count; zero-area projections are skipped by the stated rule instead of being sampled.
 * @evidence contracts/common.md#meaningful-documentation States the query plane per axis, frame and unit, the envelope meaning and edge rule, the skipped parallel faces, the snapshot, and every refusal at creation and query.
 * @evidence contracts/performance.md#efficient-algorithms Creation is linear in triangles plus the grid cells each projected box covers; a query reads one cell, so its cost is that cell's triangle count, small for the evenly spread surfaces it serves and at worst every triangle when one triangle spans the whole grid.
 * @evidence contracts/performance.md#reuse-equivalent-work The projected triangles and the grid are built once per sampler and reused by every query; the sampler itself is the caller's to keep for as long as the mesh is resident.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the projected corners of every non-degenerate triangle and a map of at most 1,024 cells holding triangle references, all sized at creation and released when the caller drops the sampler; no callback captures the caller's mesh, so it is not kept alive.
 * @author Samchon
 */
export function createAutoMovieMeshDepthSampler(
  mesh: IAutoMovieMesh,
  axis: "x" | "y" | "z",
): (u: number, v: number) => { minimum: number; maximum: number } | null {
  if (axis !== "x" && axis !== "y" && axis !== "z")
    throw new Error("A depth sampling axis must be X, Y or Z.");
  const axes: readonly number[] = { x: [1, 2, 0], y: [2, 0, 1], z: [0, 1, 2] }[
    axis
  ];
  const indices: number[] = triangleIndicesOf(mesh, "Depth sampling");
  if (!mesh.positions.every(Number.isFinite))
    throw new Error("Depth sampling needs finite complete triangle buffers.");
  const triangles: IProjectedTriangle[] = [];
  let minU: number = Infinity;
  let minV: number = Infinity;
  let maxU: number = -Infinity;
  let maxV: number = -Infinity;
  // Plain loops: a callback reading `mesh` would keep the caller's mesh alive
  // in the returned sampler's closure context.
  for (let i: number = 0; i < indices.length; i += 3) {
    const a: number[] = [];
    const b: number[] = [];
    const c: number[] = [];
    for (const component of axes) {
      a.push(mesh.positions[3 * indices[i]! + component]!);
      b.push(mesh.positions[3 * indices[i + 1]! + component]!);
      c.push(mesh.positions[3 * indices[i + 2]! + component]!);
    }
    const area: number =
      (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!);
    if (!Number.isFinite(area))
      throw new Error("Projected triangle arithmetic must remain finite.");
    if (area === 0) continue;
    triangles.push({ a, b, c, area });
    minU = Math.min(minU, a[0]!, b[0]!, c[0]!);
    maxU = Math.max(maxU, a[0]!, b[0]!, c[0]!);
    minV = Math.min(minV, a[1]!, b[1]!, c[1]!);
    maxV = Math.max(maxV, a[1]!, b[1]!, c[1]!);
  }
  if (
    triangles.length !== 0 &&
    (!Number.isFinite(maxU - minU) || !Number.isFinite(maxV - minV))
  )
    throw new Error("Projected mesh extent must remain finite.");
  const resolution: number = 32;
  const cellU = (u: number): number =>
    Math.min(
      resolution - 1,
      Math.floor(resolution * ((u - minU) / (maxU - minU))),
    );
  const cellV = (v: number): number =>
    Math.min(
      resolution - 1,
      Math.floor(resolution * ((v - minV) / (maxV - minV))),
    );
  const bins: Map<number, IProjectedTriangle[]> = new Map();
  for (const triangle of triangles) {
    const { a, b, c } = triangle;
    for (
      let u: number = cellU(Math.min(a[0]!, b[0]!, c[0]!));
      u <= cellU(Math.max(a[0]!, b[0]!, c[0]!));
      u++
    )
      for (
        let v: number = cellV(Math.min(a[1]!, b[1]!, c[1]!));
        v <= cellV(Math.max(a[1]!, b[1]!, c[1]!));
        v++
      ) {
        const key: number = u * resolution + v;
        const bin: IProjectedTriangle[] | undefined = bins.get(key);
        if (bin === undefined) bins.set(key, [triangle]);
        else bin.push(triangle);
      }
  }
  return (
    u: number,
    v: number,
  ): { minimum: number; maximum: number } | null => {
    if (!Number.isFinite(u) || !Number.isFinite(v))
      throw new Error("Surface query coordinates must be finite.");
    if (u < minU || u > maxU || v < minV || v > maxV) return null;
    let minimum: number = Infinity;
    let maximum: number = -Infinity;
    for (const { a, b, c, area } of bins.get(
      cellU(u) * resolution + cellV(v),
    ) ?? []) {
      const beta: number =
        ((u - a[0]!) * (c[1]! - a[1]!) - (v - a[1]!) * (c[0]! - a[0]!)) / area;
      const gamma: number =
        ((b[0]! - a[0]!) * (v - a[1]!) - (b[1]! - a[1]!) * (u - a[0]!)) / area;
      if (beta < -1e-10 || gamma < -1e-10 || beta + gamma > 1 + 1e-10) continue;
      const depth: number =
        a[2]! * (1 - beta - gamma) + b[2]! * beta + c[2]! * gamma;
      if (!Number.isFinite(depth))
        throw new Error("Interpolated surface depth must remain finite.");
      minimum = Math.min(minimum, depth);
      maximum = Math.max(maximum, depth);
    }
    return minimum === Infinity ? null : { minimum, maximum };
  };
}

/** One triangle projected to the query plane, with depth as its third value. */
interface IProjectedTriangle {
  /** First corner as `[u, v, depth]`. */
  a: number[];

  /** Second corner as `[u, v, depth]`. */
  b: number[];

  /** Third corner as `[u, v, depth]`. */
  c: number[];

  /** Twice the signed projected area, nonzero. */
  area: number;
}
