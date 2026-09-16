/**
 * Resident-triangle depth ordering for shared contact and rigid mesh placement.
 * measureAutoMovieMeshClearance projects immutable caller buffers, conservatively
 * selects overlapping bounds, then clips every surviving triangle pair. Only
 * that complete overlap supplies signed depth; the index never approximates it.
 * separateAutoMovieMeshSequence consumes the same values as translation bounds.
 * Coordinates use mesh-local metres; callers own transforms and recompute any
 * derived fits when resident geometry changes. Ray-parallel faces have no depth
 * graph and remain outside this directional query's closed-volume guarantees.
 */
import type { IAutoMovieMesh } from "@automovie/interface";

type Triangle = {
  points: number[][];
  vertices: number[];
  ordinal: number;
  area: number;
  bounds: number[];
};
type TriangleTree = {
  bounds: number[];
} & ({ triangles: Triangle[] } | { children: [TriangleTree, TriangleTree] });

/**
 * An affine contact condition at one clipped overlap vertex. Barycentric weights
 * belong to the original front triangle, including small negative roundoff;
 * clipping or renormalizing them would change the measured plane. Advancing its
 * three vertices by d changes this signed gap by weights dot d. Arrays are
 * independent of the resident mesh and may be retained by the visitor.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies exact projected-overlap conditions for a shared displacement solve rather than sampling only mesh corners.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Associates each affine depth witness with both triangle ordinals and the original front vertex identities.
 * @author Samchon
 */
export interface IAutoMovieMeshClearanceWitness {
  /** Front triangle ordinal, before any spatial indexing. */
  triangle: number;
  /** Back triangle ordinal, before any spatial indexing. */
  backTriangle: number;
  /** The front triangle's three original vertex ordinals. */
  vertices: number[];
  /** Affine coefficients in the same order as vertices. */
  weights: number[];
  /** Front-minus-back depth at the overlap vertex, in mesh-local metres. */
  gap: number;
}

/**
 * Measure front-minus-back depth over the complete projected overlap of two
 * triangle meshes. Each returned entry belongs to a front triangle and gives
 * its smallest signed separation from any back triangle, in mesh-local metres.
 * Positive is clear, zero is contact, negative violates the declared ordering.
 * An unreported triangle has no projected overlap. Neither input is changed.
 *
 * The depth difference is affine on each triangle-pair intersection polygon,
 * so its minimum occurs at a polygon vertex. Checking only mesh vertices misses
 * crossing edges and a curved resident surface inside a larger front triangle.
 * Coordinates for X/Y/Z depth are YZ/ZX/XY. Ray-parallel triangles are skipped:
 * this is directional surface ordering, not a closed-volume collision test.
 * Inputs must already share a frame; callers own transforms and contact pairs.
 * An optional visitor receives every overlap vertex, including already-clear
 * witnesses. A later coupled displacement must preserve those inequalities too.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Measures resident triangle separation for subsequent rigid placement or shared-surface contact without subject-specific geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains front triangle ordinals while evaluating their complete projected overlap with the supporting mesh.
 */
export function measureAutoMovieMeshClearance(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  axis: "x" | "y" | "z",
  visit?: (witness: IAutoMovieMeshClearanceWitness) => void,
): { triangle: number; minimum: number }[] {
  const axes = depthAxes(axis);
  const fronts = triangles(front, axes),
    backs = triangles(back, axes);
  // A hierarchy rejects disjoint projected regions before polygon clipping.
  // Touching bounds survive: an edge or point can own the minimum depth.
  const tree = triangleTree(backs.filter((t) => t.area !== 0));
  const result: { triangle: number; minimum: number }[] = [];
  for (const [triangle, a] of fronts.entries()) {
    if (a.area === 0) continue;
    let minimum = Infinity;
    for (const b of overlappingTriangles(tree, a.bounds)) {
      const overlap = clip(a.points, b);
      for (const point of overlap) {
        const weights = barycentric(a, point);
        const gap = depth(a, weights) - depth(b, barycentric(b, point));
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
    }
    if (minimum !== Infinity) result.push({ triangle, minimum });
  }
  return result;
}

/**
 * Build a balanced immutable index over already validated projected triangles.
 * The widest-axis median avoids the quadratic prefix scan of an X-only list.
 * Eight triangles per leaf is a traversal cost choice, never a geometry sample
 * count: every leaf triangle still receives its own inclusive bounds test.
 * Halved spans and quarter-coordinate centre differences keep ordering
 * arithmetic finite even when the full coordinate range would overflow.
 */
function triangleTree(triangles: Triangle[]): TriangleTree | null {
  if (triangles.length === 0) return null;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const triangle of triangles)
    for (let axis = 0; axis < 2; axis++) {
      bounds[axis] = Math.min(bounds[axis], triangle.bounds[axis]);
      bounds[axis + 2] = Math.max(bounds[axis + 2], triangle.bounds[axis + 2]);
    }
  if (triangles.length <= 8) return { bounds, triangles };
  const axis =
    bounds[2] / 2 - bounds[0] / 2 >= bounds[3] / 2 - bounds[1] / 2 ? 0 : 1;
  const ordered = [...triangles].sort(
    (a, b) =>
      a.bounds[axis] / 4 +
      a.bounds[axis + 2] / 4 -
      (b.bounds[axis] / 4 + b.bounds[axis + 2] / 4),
  );
  const middle = Math.floor(ordered.length / 2);
  // Both nonempty children follow from length > 8 and the interior median.
  return {
    bounds,
    children: [
      triangleTree(ordered.slice(0, middle))!,
      triangleTree(ordered.slice(middle))!,
    ],
  };
}

/** Inclusive overlap preserves boundary contacts and rejects only proven gaps. */
function overlaps(a: number[], b: number[]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function* overlappingTriangles(
  tree: TriangleTree | null,
  bounds: number[],
): Generator<Triangle> {
  if (tree === null || !overlaps(tree.bounds, bounds)) return;
  if ("triangles" in tree) {
    for (const triangle of tree.triangles)
      if (overlaps(triangle.bounds, bounds)) yield triangle;
  } else
    for (const child of tree.children)
      yield* overlappingTriangles(child, bounds);
}

/**
 * Separate an ordered mesh sequence along one positive local axis, retaining
 * every shape, normal and transverse coordinate. Each earlier/later pair passes
 * an axial bound or complete projected overlap. A signed minimum g imposes
 * t[later]-t[earlier] >= clearance-g. A forward longest-path pass satisfies all
 * pair constraints without an iterative collision correction or a guessed size.
 * Translations are nondecreasing before their common half-range is subtracted;
 * the first/last translations therefore balance around zero. Already separated
 * input has zero travel. Returned meshes own their buffers.
 *
 * Mesh coordinates and nonnegative clearance use metres. Input order is the
 * requested order, not an inferred spatial sort. The same ray-parallel limit as
 * measureAutoMovieMeshClearance applies; this does not pack arbitrary volumes
 * around corners or preserve an external path after separation.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Composes resident separation measurements into rigid placement of ordered meshes while retaining their authored shape.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves triangle connectivity and attributes while applying a common-axis translation satisfying every measured pair constraint.
 */
export function separateAutoMovieMeshSequence(
  meshes: readonly IAutoMovieMesh[],
  axis: "x" | "y" | "z",
  clearance = 0,
): IAutoMovieMesh[] {
  const axes = depthAxes(axis);
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error(
      "Mesh separation clearance must be finite and nonnegative.",
    );
  const intervals = meshes.map((mesh) => {
    triangles(mesh, axes);
    let minimum = Infinity,
      maximum = -Infinity;
    for (let i = axes[2]; i < mesh.positions.length; i += 3) {
      minimum = Math.min(minimum, mesh.positions[i]);
      maximum = Math.max(maximum, mesh.positions[i]);
    }
    return { minimum, maximum };
  });
  const travel = new Array<number>(meshes.length).fill(0);
  for (let later = 1; later < meshes.length; later++) {
    travel[later] = travel[later - 1];
    for (let earlier = 0; earlier < later; earlier++) {
      // Nondecreasing translations only enlarge an already-clear depth gap.
      // This conservative interval proof avoids clipping distant pairs while
      // retaining all close and overlapping pairs, including non-neighbours.
      if (intervals[later].minimum - intervals[earlier].maximum >= clearance)
        continue;
      for (const { minimum } of measureAutoMovieMeshClearance(
        meshes[later],
        meshes[earlier],
        axis,
      ))
        travel[later] = Math.max(
          travel[later],
          travel[earlier] + (clearance - minimum),
        );
    }
    if (!Number.isFinite(travel[later]))
      throw new Error("Mesh separation exceeds finite translation.");
  }
  const centre = (travel.at(-1) ?? 0) / 2;
  return meshes.map((mesh, index) => {
    const result = structuredClone(mesh);
    for (let i = axes[2]; i < result.positions.length; i += 3) {
      result.positions[i] += travel[index] - centre;
      if (!Number.isFinite(result.positions[i]))
        throw new Error("Mesh separation exceeds finite positions.");
    }
    return result;
  });
}

function depthAxes(axis: "x" | "y" | "z"): number[] {
  if (axis !== "x" && axis !== "y" && axis !== "z")
    throw new Error("Mesh clearance needs an X, Y or Z depth axis.");
  return { x: [1, 2, 0], y: [2, 0, 1], z: [0, 1, 2] }[axis];
}

function triangles(mesh: IAutoMovieMesh, axes: number[]): Triangle[] {
  const indices =
    mesh.indices ??
    Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
  if (
    mesh.positions.length % 3 !== 0 ||
    !mesh.positions.every(Number.isFinite) ||
    indices.length % 3 !== 0 ||
    indices.some(
      (i) => !Number.isInteger(i) || i < 0 || i >= mesh.positions.length / 3,
    )
  )
    throw new Error("Mesh clearance needs finite complete triangle buffers.");
  const result: Triangle[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const points = indices
      .slice(i, i + 3)
      .map((id) => axes.map((axis) => mesh.positions[3 * id + axis]));
    const area = side(points[0], points[1], points[2]);
    if (!Number.isFinite(area))
      throw new Error("Mesh clearance projected area must remain finite.");
    result.push({
      points,
      vertices: indices.slice(i, i + 3),
      ordinal: i / 3,
      area,
      bounds: [
        Math.min(...points.map((p) => p[0])),
        Math.min(...points.map((p) => p[1])),
        Math.max(...points.map((p) => p[0])),
        Math.max(...points.map((p) => p[1])),
      ],
    });
  }
  return result;
}

function side(a: number[], b: number[], p: number[]): number {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

function barycentric(triangle: Triangle, p: number[]): number[] {
  const [a, b, c] = triangle.points;
  const beta = side(a, p, c) / triangle.area,
    gamma = side(a, b, p) / triangle.area;
  return [1 - beta - gamma, beta, gamma];
}

function depth(triangle: Triangle, weights: number[]): number {
  const [a, b, c] = triangle.points;
  return a[2] * weights[0] + b[2] * weights[1] + c[2] * weights[2];
}

function clip(points: number[][], triangle: Triangle): number[][] {
  let polygon = points;
  const sign = Math.sign(triangle.area);
  for (let edge = 0; edge < 3; edge++) {
    const a = triangle.points[edge],
      b = triangle.points[(edge + 1) % 3];
    const input = polygon;
    polygon = [];
    for (let i = 0; i < input.length; i++) {
      const current = input[i],
        previous = input[(i + input.length - 1) % input.length];
      const dc = sign * side(a, b, current),
        dp = sign * side(a, b, previous);
      if (!Number.isFinite(dc) || !Number.isFinite(dp))
        throw new Error("Mesh clearance clipping must remain finite.");
      if (dc >= 0 !== dp >= 0) {
        // Normalize before dividing: dp-dc can overflow for finite opposite
        // signs, whereas these bounded signed ratios retain the same crossing.
        const scale = Math.max(Math.abs(dp), Math.abs(dc));
        const t = dp / scale / (dp / scale - dc / scale);
        polygon.push(
          [0, 1].map((axis) => previous[axis] * (1 - t) + current[axis] * t),
        );
      }
      if (dc >= 0) polygon.push(current);
    }
  }
  return polygon;
}
