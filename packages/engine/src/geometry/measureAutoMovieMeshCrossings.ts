import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";

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
  const at = (vertex: number): number[] => [
    mesh.positions[vertex * 3],
    mesh.positions[vertex * 3 + 1],
    mesh.positions[vertex * 3 + 2],
  ];
  for (let t = 0; t < indices.length; t += 3) {
    const a = at(indices[t]);
    const b = at(indices[t + 1]);
    const c = at(indices[t + 2]);
    out.push({
      ordinal: t / 3,
      corners: [a, b, c],
      low: [
        Math.min(a[0], b[0], c[0]),
        Math.min(a[1], b[1], c[1]),
        Math.min(a[2], b[2], c[2]),
      ],
      high: [
        Math.max(a[0], b[0], c[0]),
        Math.max(a[1], b[1], c[1]),
        Math.max(a[2], b[2], c[2]),
      ],
    });
  }
  return out;
};

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
  // vector differences, cross and dot products written out as scalars,
  // allocating nothing: this runs for every candidate pair of every mesh
  const [t0, t1, t2] = triangle;
  const e1x = t1[0] - t0[0],
    e1y = t1[1] - t0[1],
    e1z = t1[2] - t0[2];
  const e2x = t2[0] - t0[0],
    e2y = t2[1] - t0[1],
    e2z = t2[2] - t0[2];
  const dx = target[0] - origin[0],
    dy = target[1] - origin[1],
    dz = target[2] - origin[2];
  const px = dy * e2z - dz * e2y,
    py = dz * e2x - dx * e2z,
    pz = dx * e2y - dy * e2x;
  const determinant = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(determinant) < 1e-15) return false;
  const inverse = 1 / determinant;
  const ox = origin[0] - t0[0],
    oy = origin[1] - t0[1],
    oz = origin[2] - t0[2];
  const u = (ox * px + oy * py + oz * pz) * inverse;
  if (u <= 0 || u >= 1) return false;
  const ax = oy * e1z - oz * e1y,
    ay = oz * e1x - ox * e1z,
    az = ox * e1y - oy * e1x;
  const v = (dx * ax + dy * ay + dz * az) * inverse;
  if (v <= 0 || u + v >= 1) return false;
  const distance = (e2x * ax + e2y * ay + e2z * az) * inverse;
  return distance > 0 && distance < 1;
};

const coincide = (a: number[], b: number[]): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * A segment that begins or ends at a corner of the other triangle sits on its
 * boundary, and the strict bounds above are meant to exclude it. In floating
 * point they do not always: the barycentric coordinates of that corner come
 * out as a rounding residue rather than as an exact zero, so two triangles of
 * one connected surface that share a vertex could report each other. The
 * shared corner is therefore excluded by identity before the arithmetic. A
 * fold through a shared vertex still reports, because its other edges cross.
 */
const touchesCorner = (point: number[], triangle: number[][]): boolean =>
  coincide(point, triangle[0]) ||
  coincide(point, triangle[1]) ||
  coincide(point, triangle[2]);

const EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

const pierces = (first: number[][], second: number[][]): boolean => {
  for (const [from, to] of EDGES) {
    if (
      !touchesCorner(first[from], second) &&
      !touchesCorner(first[to], second) &&
      segmentPierces(first[from], first[to], second)
    )
      return true;
    if (
      !touchesCorner(second[from], first) &&
      !touchesCorner(second[to], first) &&
      segmentPierces(second[from], second[to], first)
    )
      return true;
  }
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
  // the rejection almost every candidate takes, written out as scalars
  const [f0, f1, f2] = first;
  const ux = f1[0] - f0[0],
    uy = f1[1] - f0[1],
    uz = f1[2] - f0[2];
  const vx = f2[0] - f0[0],
    vy = f2[1] - f0[1],
    vz = f2[2] - f0[2];
  const nx = uy * vz - uz * vy,
    ny = uz * vx - ux * vz,
    nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz);
  if (length < 1e-15) return false;
  for (const point of second)
    if (
      !(
        Math.abs(
          ((point[0] - f0[0]) * nx +
            (point[1] - f0[1]) * ny +
            (point[2] - f0[2]) * nz) /
            length,
        ) < 1e-9
      )
    )
      return false;
  const normal = [nx, ny, nz];
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
 * crossing is or which surface should move; the first is what
 * `measureAutoMovieMeshClearance` supplies along a chosen axis. Whether a
 * surface intersects itself is this same test with one mesh as both
 * arguments: a triangle does not cross itself, and triangles that share an
 * edge or a corner without folding through each other are touching
 * (`measureAutoMovieModelCrossings` with `withinParts`).
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
  // Cells are numbered exactly inside the second mesh's cell box, so the
  // walk visits the same cells in the same order as a textual key would and
  // a first-mesh cell outside that box simply holds nothing; the candidate
  // list keeps first-seen order through a per-query stamp.
  const cellOf = (value: number): number => Math.floor(value / cell);
  let lowX = Infinity,
    lowY = Infinity,
    lowZ = Infinity,
    highX = -Infinity,
    highY = -Infinity,
    highZ = -Infinity;
  for (const triangle of theirs) {
    lowX = Math.min(lowX, cellOf(triangle.low[0]));
    lowY = Math.min(lowY, cellOf(triangle.low[1]));
    lowZ = Math.min(lowZ, cellOf(triangle.low[2]));
    highX = Math.max(highX, cellOf(triangle.high[0]));
    highY = Math.max(highY, cellOf(triangle.high[1]));
    highZ = Math.max(highZ, cellOf(triangle.high[2]));
  }
  const spanY = highY - lowY + 1;
  const spanZ = highZ - lowZ + 1;
  // an exact number while the box's cell count is a safe integer, text past
  // it, so two cells never share a bucket
  const exact = (highX - lowX + 1) * spanY * spanZ <= Number.MAX_SAFE_INTEGER;
  const key = (x: number, y: number, z: number): number | string =>
    exact
      ? ((x - lowX) * spanY + (y - lowY)) * spanZ + (z - lowZ)
      : `${x},${y},${z}`;
  const grid = new Map<number | string, Indexed[]>();
  const walk = (
    low: number[],
    high: number[],
    visit: (at: number | string) => void,
  ): void => {
    const x1 = Math.min(cellOf(high[0]), highX);
    const y1 = Math.min(cellOf(high[1]), highY);
    const z1 = Math.min(cellOf(high[2]), highZ);
    for (let x = Math.max(cellOf(low[0]), lowX); x <= x1; x++)
      for (let y = Math.max(cellOf(low[1]), lowY); y <= y1; y++)
        for (let z = Math.max(cellOf(low[2]), lowZ); z <= z1; z++)
          visit(key(x, y, z));
  };
  for (const triangle of theirs)
    walk(triangle.low, triangle.high, (at) => {
      const bucket = grid.get(at);
      if (bucket === undefined) grid.set(at, [triangle]);
      else bucket.push(triangle);
    });
  const crossings: IAutoMovieMeshCrossing[] = [];
  const stamp = new Int32Array(theirs.length).fill(-1);
  for (const triangle of ours) {
    const candidates: Indexed[] = [];
    walk(triangle.low, triangle.high, (at) => {
      const bucket = grid.get(at);
      if (bucket === undefined) return;
      for (const candidate of bucket)
        if (stamp[candidate.ordinal] !== triangle.ordinal) {
          stamp[candidate.ordinal] = triangle.ordinal;
          candidates.push(candidate);
        }
    });
    let pierced: Indexed | undefined;
    let flat: Indexed | undefined;
    for (const candidate of candidates) {
      if (
        candidate.high[0] < triangle.low[0] ||
        candidate.low[0] > triangle.high[0] ||
        candidate.high[1] < triangle.low[1] ||
        candidate.low[1] > triangle.high[1] ||
        candidate.high[2] < triangle.low[2] ||
        candidate.low[2] > triangle.high[2]
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
