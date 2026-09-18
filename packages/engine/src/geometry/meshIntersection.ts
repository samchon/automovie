/**
 * Triangle-crossing detection between two resident meshes in one shared frame.
 *
 * This is the closed-volume question its neighbour deliberately does not answer.
 * `measureAutoMovieMeshClearance` orders surfaces along one axis for stacking and
 * contact, and says so: it skips ray-parallel faces and is directional ordering
 * rather than a collision test. A caller that needs to know whether two surfaces
 * actually pass through each other, teeth through a lip, a prop through a wall,
 * has nowhere to ask. That question is direction free, so it is answered here
 * instead of by choosing an axis and hoping.
 *
 * Two triangles in three dimensions cross when an edge of one pierces the other
 * strictly, passing from one side to the other rather than stopping on it.
 * Testing all six edges both ways catches every transversal crossing, and the
 * strictness is what keeps a shared seam from reading as a collision. It does
 * not catch coplanar overlap, where two triangles lie in one plane and no edge
 * leaves it, so that case is decided separately in the shared plane and flagged
 * rather than silently counted as clear. A caller deciding whether a pose is
 * usable needs the difference between "nothing crosses" and "one pair is flat
 * against another".
 *
 * Coordinates are mesh-local metres and both inputs must already share a frame;
 * callers own transforms, as they do for clearance. Neither input is changed.
 * Cost is driven by how much the two meshes overlap in space rather than by
 * their total size, because only triangles sharing a grid cell are compared.
 */
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One triangle of the first mesh that a triangle of the second mesh crosses.
 *
 * Ordinals are positions in each mesh's own `indices`, before any spatial
 * indexing, so a caller can map a report straight back to the buffer it owns.
 * A triangle is reported once with a single witness rather than once per
 * crossing pair, because the question a caller asks of this is which of its
 * triangles are compromised, not how many ways each one is.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshCrossing {
  /** First-mesh triangle ordinal, before any spatial indexing. */
  triangle: number;
  /** A second-mesh triangle ordinal that pierces it. */
  other: number;
  /** True when the two lie in one plane and overlap without either piercing. */
  coplanar: boolean;
}

/** Local triangle record: three corners and the bounds used to index them. */
interface Indexed {
  ordinal: number;
  corners: number[][];
  low: number[];
  high: number[];
}

/**
 * Index a mesh's triangles, admitting the same buffers clearance admits.
 *
 * An absent index buffer means consecutive position triples, the convention
 * this package already uses. Malformed buffers are refused here rather than
 * producing a report about triangles that do not exist.
 */
const index = (mesh: IAutoMovieMesh): Indexed[] => {
  const indices =
    mesh.indices ??
    Array.from({ length: mesh.positions.length / 3 }, (_, at) => at);
  if (
    mesh.positions.length % 3 !== 0 ||
    !mesh.positions.every(Number.isFinite) ||
    indices.length % 3 !== 0 ||
    indices.some(
      (at) =>
        !Number.isInteger(at) || at < 0 || at >= mesh.positions.length / 3,
    )
  )
    throw new Error("Mesh crossings need finite complete triangle buffers.");
  const out: Indexed[] = [];
  for (let at = 0; at < indices.length; at += 3) {
    const points = indices
      .slice(at, at + 3)
      .map((vertex) => [
        mesh.positions[vertex * 3],
        mesh.positions[vertex * 3 + 1],
        mesh.positions[vertex * 3 + 2],
      ]);
    out.push({
      ordinal: at / 3,
      corners: points,
      low: [0, 1, 2].map((axis) => Math.min(...points.map((p) => p[axis]))),
      high: [0, 1, 2].map((axis) => Math.max(...points.map((p) => p[axis]))),
    });
  }
  return out;
};

const subtract = (a: number[], b: number[]): number[] => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const cross = (a: number[], b: number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: number[], b: number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Moller-Trumbore, bounded to the segment rather than extended to a whole ray.
 *
 * Every bound is strict, because touching is not crossing. Two shells that meet
 * along a seam share vertices and edges by construction, and an inclusive test
 * would report every such seam as a collision, which would make the measure
 * useless exactly where surfaces are supposed to meet. A segment that ends on
 * the surface, or shares a corner with it, passes through nothing. Real
 * penetration puts the crossing strictly inside both the segment and the
 * triangle, so nothing a caller would want reported is lost.
 *
 * A parallel segment returns false and is left to the coplanar report.
 */
const segmentPierces = (
  origin: number[],
  target: number[],
  triangle: number[][],
): boolean => {
  const edge1 = subtract(triangle[1], triangle[0]);
  const edge2 = subtract(triangle[2], triangle[0]);
  const direction = subtract(target, origin);
  const perpendicular = cross(direction, edge2);
  const determinant = dot(edge1, perpendicular);
  if (Math.abs(determinant) < 1e-15) return false;
  const inverse = 1 / determinant;
  const toOrigin = subtract(origin, triangle[0]);
  const u = dot(toOrigin, perpendicular) * inverse;
  if (u <= 0 || u >= 1) return false;
  const along = cross(toOrigin, edge1);
  const v = dot(direction, along) * inverse;
  if (v <= 0 || u + v >= 1) return false;
  const distance = dot(edge2, along) * inverse;
  return distance > 0 && distance < 1;
};

const pierces = (first: number[][], second: number[][]): boolean => {
  for (const [from, to] of [
    [0, 1],
    [1, 2],
    [2, 0],
  ])
    if (
      segmentPierces(first[from], first[to], second) ||
      segmentPierces(second[from], second[to], first)
    )
      return true;
  return false;
};

/** The axis to drop when flattening a plane with this normal, keeping area. */
const dominant = (normal: number[]): number =>
  [0, 1, 2].reduce((best, axis) =>
    Math.abs(normal[axis]) > Math.abs(normal[best]) ? axis : best,
  );

const flatten = (point: number[], drop: number): number[] =>
  [0, 1, 2].filter((axis) => axis !== drop).map((axis) => point[axis]);

const side = (a: number[], b: number[], p: number[]): number =>
  (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

const within = (triangle: number[][], point: number[]): boolean => {
  const signs = [0, 1, 2].map((corner) =>
    side(triangle[corner], triangle[(corner + 1) % 3], point),
  );
  return signs.every((value) => value > 0) || signs.every((value) => value < 0);
};

const segmentsMeet = (
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): boolean => {
  const first = side(a, b, c) * side(a, b, d);
  const second = side(c, d, a) * side(c, d, b);
  return first < 0 && second < 0;
};

/**
 * True when two triangles lie in one plane and their areas overlap.
 *
 * Coplanarity alone is not a crossing: two triangles can share a plane and sit
 * apart, and reporting that would make the coplanar count meaningless. Both
 * conditions are required, and overlap is decided in the plane by properly
 * crossing edges or by either triangle strictly containing the other's first
 * corner, which together cover partial overlap and full containment. Both
 * tests are strict for the same reason the piercing test is: two coplanar
 * triangles meeting at a shared corner or along a shared edge are touching,
 * not overlapping, and a seam must not read as a collision.
 */
const sharePlaneAndOverlap = (
  first: number[][],
  second: number[][],
): boolean => {
  const normal = cross(
    subtract(first[1], first[0]),
    subtract(first[2], first[0]),
  );
  const length = Math.hypot(normal[0], normal[1], normal[2]);
  if (length < 1e-15) return false;
  const coplanar = second.every(
    (point) => Math.abs(dot(subtract(point, first[0]), normal) / length) < 1e-9,
  );
  if (!coplanar) return false;
  const drop = dominant(normal);
  const here = first.map((point) => flatten(point, drop));
  const there = second.map((point) => flatten(point, drop));
  if (within(here, there[0]) || within(there, here[0])) return true;
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      if (
        segmentsMeet(here[a], here[(a + 1) % 3], there[b], there[(b + 1) % 3])
      )
        return true;
  return false;
};

/**
 * Report every triangle of `first` that a triangle of `second` crosses.
 *
 * The result is empty when the two surfaces are disjoint or merely adjacent.
 * A returned entry names the first-mesh triangle, one second-mesh witness, and
 * whether the pair crosses transversally or lies flat in one plane. Ordering is
 * by first-mesh ordinal, so the same inputs always produce the same report.
 *
 * This answers containment-free overlap only. It does not say how deep the
 * crossing is, which surface should move, or whether a surface intersects
 * itself; the first is what `measureAutoMovieMeshClearance` supplies along a
 * chosen axis, and the last is a different question over one mesh.
 *
 * @param first Mesh whose triangles are reported.
 * @param second Mesh tested against it, in the same frame.
 * @returns One entry per crossed triangle of `first`, in ordinal order.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies a direction-free crossing test composable with the axis-ordered clearance measure, without depending on any catalogue item.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports crossings against the original triangle ordinals of both meshes so a caller can map them onto the buffers it owns.
 */
export function measureAutoMovieMeshCrossings(
  first: IAutoMovieMesh,
  second: IAutoMovieMesh,
): IAutoMovieMeshCrossing[] {
  const ours = index(first);
  const theirs = index(second);
  if (ours.length === 0 || theirs.length === 0) return [];
  // One cell a little larger than the mean second-mesh triangle keeps the
  // candidate list short without letting a long triangle span many cells.
  const span =
    theirs.reduce(
      (total, triangle) =>
        total +
        Math.max(
          triangle.high[0] - triangle.low[0],
          triangle.high[1] - triangle.low[1],
          triangle.high[2] - triangle.low[2],
        ),
      0,
    ) / theirs.length;
  const cell = span > 0 ? span : 1;
  const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
  const grid = new Map<string, Indexed[]>();
  const walk = (
    low: number[],
    high: number[],
    visit: (at: string) => void,
  ): void => {
    for (
      let x = Math.floor(low[0] / cell);
      x <= Math.floor(high[0] / cell);
      x++
    )
      for (
        let y = Math.floor(low[1] / cell);
        y <= Math.floor(high[1] / cell);
        y++
      )
        for (
          let z = Math.floor(low[2] / cell);
          z <= Math.floor(high[2] / cell);
          z++
        )
          visit(key(x, y, z));
  };
  for (const triangle of theirs)
    walk(triangle.low, triangle.high, (at) => {
      const bucket = grid.get(at);
      if (bucket === undefined) grid.set(at, [triangle]);
      else bucket.push(triangle);
    });
  const crossings: IAutoMovieMeshCrossing[] = [];
  for (const triangle of ours) {
    const candidates = new Set<Indexed>();
    walk(triangle.low, triangle.high, (at) => {
      for (const candidate of grid.get(at) ?? []) candidates.add(candidate);
    });
    let pierced: Indexed | undefined;
    let flat: Indexed | undefined;
    for (const candidate of candidates) {
      if (
        [0, 1, 2].some(
          (axis) =>
            candidate.high[axis] < triangle.low[axis] ||
            candidate.low[axis] > triangle.high[axis],
        )
      )
        continue;
      if (pierces(triangle.corners, candidate.corners)) {
        pierced = candidate;
        break;
      }
      if (
        flat === undefined &&
        sharePlaneAndOverlap(triangle.corners, candidate.corners)
      )
        flat = candidate;
    }
    const witness = pierced ?? flat;
    if (witness !== undefined)
      crossings.push({
        triangle: triangle.ordinal,
        other: witness.ordinal,
        coplanar: pierced === undefined,
      });
  }
  return crossings;
}
