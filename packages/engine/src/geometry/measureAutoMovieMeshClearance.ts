import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshClearanceWitness } from "./IAutoMovieMeshClearanceWitness";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Measure front-minus-back depth along one axis over the complete projected
 * overlap of two triangle meshes.
 *
 * Each entry belongs to one front triangle, by ordinal, and gives its smallest
 * signed depth separation from any back triangle in mesh-local metres:
 * positive is clear, zero is contact, negative breaks the declared front-back
 * ordering. A front triangle with no projected overlap is not reported. The
 * projection plane is Y/Z for depth X, Z/X for depth Y and X/Y for depth Z.
 * Triangles parallel to the depth axis are skipped, so this is directional
 * surface ordering, not a closed-volume collision test. Both meshes must
 * already share a frame; callers own transforms and which pairs may touch.
 * Neither input is changed.
 *
 * The optional `visit` receives every overlap polygon vertex as a witness,
 * clear ones included, so a later coupled displacement can keep every one of
 * those inequalities and not only the violated ones. Throws on an invalid
 * axis, a malformed index buffer, a non-finite position, and projected area,
 * clipping or depth arithmetic that overflows.
 *
 * @param front Mesh that should lie in front.
 * @param back Mesh that should lie behind.
 * @param axis Depth axis; larger values are farther front.
 * @param visit Optional receiver of every overlap witness.
 * @returns Minimum depth gap per overlapping front triangle, in ordinal order.
 *
 * @evidence contracts/common.md#principled-implementation The depth difference between two planar triangles is affine on their projected intersection polygon, so its minimum lies at a polygon vertex; Sutherland-Hodgman clipping of the front triangle against each back triangle's three edges yields exactly those vertices, including crossing edges that a vertex-only test misses.
 * @evidence contracts/common.md#clear-and-simple-design Admission uses `triangleIndicesOf`, a private 2D box tree prunes back triangles, and the clipping and barycentric helpers are local because they serve only this projected measure; `minimizeAutoMovieMeshClearance` consumes the witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Box overlap is inclusive so touching triangles, which can own the minimum, are never pruned, and the clipping parameter is formed from normalized side values so finite inputs cannot overflow into a false crossing; parallel triangles are skipped by the stated rule.
 * @evidence contracts/common.md#meaningful-documentation States what each entry means and its sign, the unreported case, the projection plane per axis, what the measure is not, frame ownership, the witness receiver's purpose, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For f front and b back triangles, building the back tree costs O(b log^2 b) and each front triangle visits only back triangles whose projected boxes overlap its own, clipping each in constant time, so the work follows the k overlapping pairs rather than f times b.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call measures one pair of surfaces in their current positions; a caller that repeats a pair after moving vertices needs a new measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds the projected triangles and the back tree for the call and returns one small record per overlapping front triangle; each witness passed to `visit` owns its vertex and weight arrays, so the receiver may keep it.
 * @author Samchon
 */
export function measureAutoMovieMeshClearance(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  axis: "x" | "y" | "z",
  visit?: (witness: IAutoMovieMeshClearanceWitness) => void,
): { triangle: number; minimum: number }[] {
  const axes: readonly number[] = depthAxes(axis);
  const fronts: IProjectedTriangle[] = triangles(front, axes);
  const backs: IProjectedTriangle[] = triangles(back, axes);
  // A hierarchy rejects disjoint projected regions before polygon clipping.
  // Touching bounds survive: an edge or point can own the minimum depth.
  const tree: ITriangleTree | null = triangleTree(
    backs.filter((t: IProjectedTriangle): boolean => t.area !== 0),
  );
  const result: { triangle: number; minimum: number }[] = [];
  fronts.forEach((a: IProjectedTriangle, triangle: number): void => {
    if (a.area === 0) return;
    let minimum: number = Infinity;
    for (const b of overlappingTriangles(tree, a.bounds))
      for (const point of clip(a.points, b)) {
        const weights: number[] = barycentric(a, point);
        const gap: number = depth(a, weights) - depth(b, barycentric(b, point));
        if (!Number.isFinite(gap))
          throw new Error("Mesh clearance arithmetic must remain finite.");
        minimum = Math.min(minimum, gap);
        visit?.({
          triangle,
          backTriangle: b.ordinal,
          vertices: [...a.vertices],
          weights,
          gap,
        });
      }
    if (minimum !== Infinity) result.push({ triangle, minimum });
  });
  return result;
}

/** One triangle projected to the clearance plane, depth as the third value. */
interface IProjectedTriangle {
  /** Corners as `[u, v, depth]`. */
  points: number[][];

  /** Original vertex indices of the corners. */
  vertices: number[];

  /** Original triangle ordinal. */
  ordinal: number;

  /** Twice the signed projected area; zero for a triangle parallel to the axis. */
  area: number;

  /** Projected box as `[minU, minV, maxU, maxV]`. */
  bounds: number[];
}

/** A node of the back-triangle tree: a leaf of triangles or two children. */
type ITriangleTree = {
  /** Projected box as `[minU, minV, maxU, maxV]` enclosing the subtree. */
  bounds: number[];
} & (
  | { triangles: IProjectedTriangle[] }
  | { children: [ITriangleTree, ITriangleTree] }
);

/**
 * Build a balanced index over projected triangles by widest-axis median.
 * Eight triangles per leaf is a traversal cost choice, never a geometry sample
 * count: every leaf triangle still receives its own inclusive bounds test.
 * Halved spans and quarter-coordinate centre differences keep ordering
 * arithmetic finite even when the full coordinate range would overflow.
 */
const triangleTree = (
  list: IProjectedTriangle[],
): ITriangleTree | null => {
  if (list.length === 0) return null;
  const bounds: number[] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const triangle of list)
    for (let axis: number = 0; axis < 2; axis++) {
      bounds[axis] = Math.min(bounds[axis]!, triangle.bounds[axis]!);
      bounds[axis + 2] = Math.max(bounds[axis + 2]!, triangle.bounds[axis + 2]!);
    }
  if (list.length <= 8) return { bounds, triangles: list };
  const axis: number =
    bounds[2]! / 2 - bounds[0]! / 2 >= bounds[3]! / 2 - bounds[1]! / 2 ? 0 : 1;
  const ordered: IProjectedTriangle[] = [...list].sort(
    (a: IProjectedTriangle, b: IProjectedTriangle): number =>
      a.bounds[axis]! / 4 +
      a.bounds[axis + 2]! / 4 -
      (b.bounds[axis]! / 4 + b.bounds[axis + 2]! / 4),
  );
  const middle: number = Math.floor(ordered.length / 2);
  // Both nonempty children follow from length > 8 and the interior median.
  return {
    bounds,
    children: [
      triangleTree(ordered.slice(0, middle))!,
      triangleTree(ordered.slice(middle))!,
    ],
  };
};

/** Inclusive overlap preserves boundary contacts and rejects only proven gaps. */
const overlaps = (a: number[], b: number[]): boolean =>
  a[0]! <= b[2]! && a[2]! >= b[0]! && a[1]! <= b[3]! && a[3]! >= b[1]!;

/** Every tree triangle whose projected box overlaps `bounds`, inclusively. */
function* overlappingTriangles(
  tree: ITriangleTree | null,
  bounds: number[],
): Generator<IProjectedTriangle> {
  if (tree === null || !overlaps(tree.bounds, bounds)) return;
  if ("triangles" in tree) {
    for (const triangle of tree.triangles)
      if (overlaps(triangle.bounds, bounds)) yield triangle;
  } else
    for (const child of tree.children)
      yield* overlappingTriangles(child, bounds);
}

/** The projected `[u, v, depth]` component order for one depth axis. */
const depthAxes = (axis: "x" | "y" | "z"): readonly number[] => {
  if (axis !== "x" && axis !== "y" && axis !== "z")
    throw new Error("Mesh clearance needs an X, Y or Z depth axis.");
  return { x: [1, 2, 0], y: [2, 0, 1], z: [0, 1, 2] }[axis];
};

/** Admit a mesh and project each of its triangles. */
const triangles = (
  mesh: IAutoMovieMesh,
  axes: readonly number[],
): IProjectedTriangle[] => {
  const indices: number[] = triangleIndicesOf(
    mesh,
    "Mesh clearance (complete triangle buffers)",
  );
  if (!mesh.positions.every(Number.isFinite))
    throw new Error("Mesh clearance needs finite complete triangle buffers.");
  const result: IProjectedTriangle[] = [];
  for (let i: number = 0; i < indices.length; i += 3) {
    const vertices: number[] = indices.slice(i, i + 3);
    const points: number[][] = vertices.map((id: number): number[] =>
      axes.map((component: number): number => mesh.positions[3 * id + component]!),
    );
    const a: number[] = points[0]!;
    const b: number[] = points[1]!;
    const c: number[] = points[2]!;
    const area: number = side(a, b, c);
    if (!Number.isFinite(area))
      throw new Error("Mesh clearance projected area must remain finite.");
    result.push({
      points,
      vertices,
      ordinal: i / 3,
      area,
      bounds: [
        Math.min(a[0]!, b[0]!, c[0]!),
        Math.min(a[1]!, b[1]!, c[1]!),
        Math.max(a[0]!, b[0]!, c[0]!),
        Math.max(a[1]!, b[1]!, c[1]!),
      ],
    });
  }
  return result;
};

/** Twice the signed area of `(a, b, p)` in the projection plane. */
const side = (a: number[], b: number[], p: number[]): number =>
  (b[0]! - a[0]!) * (p[1]! - a[1]!) - (b[1]! - a[1]!) * (p[0]! - a[0]!);

/** Barycentric weights of a projected point in a projected triangle. */
const barycentric = (triangle: IProjectedTriangle, p: number[]): number[] => {
  const a: number[] = triangle.points[0]!;
  const b: number[] = triangle.points[1]!;
  const c: number[] = triangle.points[2]!;
  const beta: number = side(a, p, c) / triangle.area;
  const gamma: number = side(a, b, p) / triangle.area;
  return [1 - beta - gamma, beta, gamma];
};

/** The triangle's depth at the given barycentric weights. */
const depth = (triangle: IProjectedTriangle, weights: number[]): number =>
  triangle.points[0]![2]! * weights[0]! +
  triangle.points[1]![2]! * weights[1]! +
  triangle.points[2]![2]! * weights[2]!;

/**
 * Sutherland-Hodgman clipping of a projected polygon against one triangle,
 * keeping the inclusive inside so touching boundaries survive.
 */
const clip = (points: number[][], triangle: IProjectedTriangle): number[][] => {
  let polygon: number[][] = points;
  const sign: number = Math.sign(triangle.area);
  for (let edge: number = 0; edge < 3; edge++) {
    const a: number[] = triangle.points[edge]!;
    const b: number[] = triangle.points[(edge + 1) % 3]!;
    const input: number[][] = polygon;
    polygon = [];
    for (let i: number = 0; i < input.length; i++) {
      const current: number[] = input[i]!;
      const previous: number[] = input[(i + input.length - 1) % input.length]!;
      const dc: number = sign * side(a, b, current);
      const dp: number = sign * side(a, b, previous);
      if (!Number.isFinite(dc) || !Number.isFinite(dp))
        throw new Error("Mesh clearance clipping must remain finite.");
      if (dc >= 0 !== dp >= 0) {
        // Normalize before dividing: dp-dc can overflow for finite opposite
        // signs, whereas these bounded signed ratios retain the same crossing.
        const scale: number = Math.max(Math.abs(dp), Math.abs(dc));
        const t: number = dp / scale / (dp / scale - dc / scale);
        polygon.push(
          [0, 1].map(
            (axis: number): number =>
              previous[axis]! * (1 - t) + current[axis]! * t,
          ),
        );
      }
      if (dc >= 0) polygon.push(current);
    }
  }
  return polygon;
};
