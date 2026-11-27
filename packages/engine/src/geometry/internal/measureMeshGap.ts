import type {
  IAutoMovieMesh,
  IAutoMovieMeshQueryHierarchy,
} from "@automovie/interface";

import { buildMeshQueryHierarchy } from "./buildMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * The least Euclidean distance between two triangle surfaces in one metre
 * frame.
 *
 * The distance between two triangles that do not cross is attained between an
 * edge of one and an edge of the other, or between a corner of one and the
 * interior of the other, so each triangle pair takes the least of its nine
 * edge-to-edge distances (Ericson 2005, Real-Time Collision Detection, 5.1.9)
 * and its six corner-to-face distances where the corner projects inside the
 * face. Edges cover every corner-to-edge and corner-to-corner case, so a
 * triangle without area still contributes through its edges. Two surfaces that
 * cross get the least distance over their non-crossing features, not 0; the
 * caller decides crossing separately.
 *
 * Each surface is prepared once by `measureMeshGap.surface` into a box
 * hierarchy over its triangles, so a caller measuring one part against many
 * prepares it once. The two hierarchies are walked together, nearest pair of
 * boxes first, and a pair of boxes no nearer than the running least distance is
 * skipped, which changes no answer; the walk stops at a distance of 0. The
 * surfaces are only read.
 * Parameter first: One prepared surface.
 * Parameter second: The other prepared surface, in the same frame.
 * Returns: The least distance in metres.
 */
export function measureMeshGap(
  first: measureMeshGap.ISurface,
  second: measureMeshGap.ISurface,
): number {
  const best: { distance2: number } = { distance2: Infinity };
  visit(first.root, second.root, best);
  return Math.sqrt(best.distance2);
}

/*
 * The prepared surfaces the gap reads.
 */
export namespace measureMeshGap {
  /*
   * One surface prepared for gap measurement: a box hierarchy over its
   * triangles, each holding its nine corner coordinates in metres.
   */
  export interface ISurface {
    /*
     * The hierarchy's root, enclosing every triangle.
     */
    root: IAutoMovieMeshQueryHierarchy<ITriangle>;
  }

  /*
   * One triangle's nine corner coordinates, in corner order, with its box.
   */
  export interface ITriangle extends IAutoMovieMeshQueryHierarchy.IEntry {
    /*
     * Corner coordinates in metres: x, y, z of each corner in turn.
     */
    corners: Float64Array;
  }

  /*
   * Prepare a mesh's triangles for gap measurement.
   * Parameter mesh: The surface; only read.
   * Parameter label: Name the refusals give it.
   * Returns: The prepared surface.
   * On a malformed index buffer, a non-finite position or a mesh
   * without triangles.
   */
  export function surface(mesh: IAutoMovieMesh, label: string): ISurface {
    const indices: number[] = triangleIndicesOf(mesh, label);
    if (indices.length === 0)
      throw new Error(`${label} needs at least one triangle`);
    const triangles: ITriangle[] = [];
    for (let at: number = 0; at < indices.length; at += 3) {
      const corners: Float64Array = new Float64Array(9);
      for (let corner: number = 0; corner < 3; ++corner)
        for (let axis: number = 0; axis < 3; ++axis)
          corners[corner * 3 + axis] =
            mesh.positions[indices[at + corner]! * 3 + axis]!;
      const low: number[] = [0, 1, 2].map((axis: number): number =>
        Math.min(corners[axis]!, corners[3 + axis]!, corners[6 + axis]!),
      );
      const high: number[] = [0, 1, 2].map((axis: number): number =>
        Math.max(corners[axis]!, corners[3 + axis]!, corners[6 + axis]!),
      );
      triangles.push({
        corners,
        low,
        high,
        centre: low.map(
          (value: number, axis: number): number => (value + high[axis]!) / 2,
        ),
      });
    }
    return { root: buildMeshQueryHierarchy(triangles) };
  }
}

/*
 * A node of a prepared surface's hierarchy.
 */
type INode = IAutoMovieMeshQueryHierarchy<measureMeshGap.ITriangle>;

/*
 * Squared distance between two boxes, a lower bound for anything inside them.
 */
const boxDistance2: (
  a: { low: number[]; high: number[] },
  b: { low: number[]; high: number[] },
) => number = (
  a: { low: number[]; high: number[] },
  b: { low: number[]; high: number[] },
): number => {
  let total: number = 0;
  for (let axis: number = 0; axis < 3; ++axis) {
    const apart: number = Math.max(
      0,
      a.low[axis]! - b.high[axis]!,
      b.low[axis]! - a.high[axis]!,
    );
    total += apart * apart;
  }
  return total;
};

/*
 * Walk two hierarchies together. A pair of nodes no nearer than the running
 * least distance is skipped; otherwise the node with more entries below it, a
 * branch before a leaf, is split and its children are visited nearest first,
 * and two leaves compare their triangles pair by pair, each pair first by its
 * boxes.
 */
const visit: (
  first: INode,
  second: INode,
  best: { distance2: number },
) => void = (
  first: INode,
  second: INode,
  best: { distance2: number },
): void => {
  if (best.distance2 === 0 || boxDistance2(first, second) >= best.distance2)
    return;
  const firstLeaf: boolean = "triangles" in first;
  const secondLeaf: boolean = "triangles" in second;
  if ("triangles" in first && "triangles" in second) {
    for (const here of first.triangles)
      for (const there of second.triangles)
        if (boxDistance2(here, there) < best.distance2)
          best.distance2 = Math.min(
            best.distance2,
            triangleDistance2(here.corners, there.corners),
          );
    return;
  }
  const splitFirst: boolean =
    secondLeaf || (!firstLeaf && boxSpan(first) >= boxSpan(second));
  if (splitFirst && "left" in first) {
    const left: number = boxDistance2(first.left, second);
    const right: number = boxDistance2(first.right, second);
    if (left <= right) {
      visit(first.left, second, best);
      visit(first.right, second, best);
    } else {
      visit(first.right, second, best);
      visit(first.left, second, best);
    }
    return;
  }
  if ("left" in second) {
    const left: number = boxDistance2(first, second.left);
    const right: number = boxDistance2(first, second.right);
    if (left <= right) {
      visit(first, second.left, best);
      visit(first, second.right, best);
    } else {
      visit(first, second.right, best);
      visit(first, second.left, best);
    }
  }
};

/*
 * A box's extents summed over its axes, which decides which node to split.
 */
const boxSpan: (node: INode) => number = (node: INode): number =>
  node.high[0]! -
  node.low[0]! +
  node.high[1]! -
  node.low[1]! +
  node.high[2]! -
  node.low[2]!;

/*
 * Squared distance between two triangles that do not cross.
 */
const triangleDistance2: (a: Float64Array, b: Float64Array) => number = (
  a: Float64Array,
  b: Float64Array,
): number => {
  let least: number = Infinity;
  for (let i: number = 0; i < 3; ++i)
    for (let j: number = 0; j < 3; ++j)
      least = Math.min(
        least,
        segmentDistance2(
          a,
          i * 3,
          ((i + 1) % 3) * 3,
          b,
          j * 3,
          ((j + 1) % 3) * 3,
        ),
      );
  for (let corner: number = 0; corner < 3; ++corner) {
    least = Math.min(least, faceDistance2(a, corner * 3, b));
    least = Math.min(least, faceDistance2(b, corner * 3, a));
  }
  return least;
};

/*
 * Squared distance from the point at `p[at..at+2]` to the interior of triangle
 * `t`, or Infinity when the point does not project inside it or the triangle
 * has no area; its edges answer those cases.
 */
const faceDistance2: (
  p: Float64Array,
  at: number,
  t: Float64Array,
) => number = (p: Float64Array, at: number, t: Float64Array): number => {
  const abx: number = t[3]! - t[0]!;
  const aby: number = t[4]! - t[1]!;
  const abz: number = t[5]! - t[2]!;
  const acx: number = t[6]! - t[0]!;
  const acy: number = t[7]! - t[1]!;
  const acz: number = t[8]! - t[2]!;
  const nx: number = aby * acz - abz * acy;
  const ny: number = abz * acx - abx * acz;
  const nz: number = abx * acy - aby * acx;
  const nn: number = nx * nx + ny * ny + nz * nz;
  if (nn === 0) return Infinity;
  for (let corner: number = 0; corner < 3; ++corner) {
    const s: number = corner * 3;
    const e: number = ((corner + 1) % 3) * 3;
    const ex: number = t[e]! - t[s]!;
    const ey: number = t[e + 1]! - t[s + 1]!;
    const ez: number = t[e + 2]! - t[s + 2]!;
    const qx: number = p[at]! - t[s]!;
    const qy: number = p[at + 1]! - t[s + 1]!;
    const qz: number = p[at + 2]! - t[s + 2]!;
    const side: number =
      (ey * qz - ez * qy) * nx +
      (ez * qx - ex * qz) * ny +
      (ex * qy - ey * qx) * nz;
    if (side < 0) return Infinity;
  }
  const offset: number =
    (p[at]! - t[0]!) * nx +
    (p[at + 1]! - t[1]!) * ny +
    (p[at + 2]! - t[2]!) * nz;
  return (offset * offset) / nn;
};

/*
 * Squared distance between segment `p[i]`-`p[j]` and segment `q[k]`-`q[l]`, by
 * Ericson's clamped closest-point parameters; a segment of zero length is read
 * as its point.
 */
const segmentDistance2: (
  p: Float64Array,
  i: number,
  j: number,
  q: Float64Array,
  k: number,
  l: number,
) => number = (
  p: Float64Array,
  i: number,
  j: number,
  q: Float64Array,
  k: number,
  l: number,
): number => {
  const d1x: number = p[j]! - p[i]!;
  const d1y: number = p[j + 1]! - p[i + 1]!;
  const d1z: number = p[j + 2]! - p[i + 2]!;
  const d2x: number = q[l]! - q[k]!;
  const d2y: number = q[l + 1]! - q[k + 1]!;
  const d2z: number = q[l + 2]! - q[k + 2]!;
  const rx: number = p[i]! - q[k]!;
  const ry: number = p[i + 1]! - q[k + 1]!;
  const rz: number = p[i + 2]! - q[k + 2]!;
  const a: number = d1x * d1x + d1y * d1y + d1z * d1z;
  const e: number = d2x * d2x + d2y * d2y + d2z * d2z;
  const f: number = d2x * rx + d2y * ry + d2z * rz;
  let s: number = 0;
  let t: number = 0;
  if (a === 0 && e === 0) {
    s = 0;
    t = 0;
  } else if (a === 0) t = clamp(f / e);
  else {
    const c: number = d1x * rx + d1y * ry + d1z * rz;
    if (e === 0) s = clamp(-c / a);
    else {
      const b: number = d1x * d2x + d1y * d2y + d1z * d2z;
      const denominator: number = a * e - b * b;
      s = denominator > 0 ? clamp((b * f - c * e) / denominator) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a);
      }
    }
  }
  const x: number = rx + d1x * s - d2x * t;
  const y: number = ry + d1y * s - d2y * t;
  const z: number = rz + d1z * s - d2z * t;
  return x * x + y * y + z * z;
};

/*
 * A parameter held to the segment, [0, 1].
 */
const clamp: (value: number) => number = (value: number): number =>
  Math.min(1, Math.max(0, value));
