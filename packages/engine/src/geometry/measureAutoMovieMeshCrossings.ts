import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";
import type { IAutoMovieMeshCrossingOptions } from "./IAutoMovieMeshCrossingOptions";
import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";
import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";
import { collectAutoMovieSpatialQueryCandidates } from "./collectAutoMovieSpatialQueryCandidates";

/**
 * Local triangle record: three corners and the bounds used to index them.
 * @author Samchon
 */
interface Indexed extends IAutoMovieSpatialQueryEntry {
  corners: number[][];
}

/**
 * Index a mesh's triangles, admitting the same buffers clearance admits.
 *
 * An absent index buffer means consecutive position triples, the convention
 * this package already uses. Malformed buffers are refused here rather than
 * producing a report about triangles that do not exist.
 */
const index = (mesh: IAutoMovieMesh): Indexed[] => {
  const indices = triangleIndicesOf(mesh, "Mesh crossings (complete triangle buffers)");
  if (!mesh.positions.every(Number.isFinite))
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
      // Half-sums keep finite endpoints finite, even when high - low overflows.
      // Centres choose the partition only; exact corner extrema bound it.
      centre: [0, 1, 2].map(
        (axis) =>
          Math.min(a[axis], b[axis], c[axis]) / 2 +
          Math.max(a[axis], b[axis], c[axis]) / 2,
      ),
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
 * triangle. This is the instrument's contact classification, not a proof
 * that every geometric intersection has such a witness.
 *
 * A parallel segment returns false and is left to the coplanar report. A
 * caller may set a dimensionless interior tolerance for its own near-contact
 * classification. Zero retains the existing strict barycentric bounds. The
 * absolute determinant cutoff of 1e-15 still excludes nearly parallel or tiny
 * configurations; the instrument does not certify those as disjoint.
 */
const segmentPierces = (
  origin: number[],
  target: number[],
  triangle: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
): boolean => {
  // Scalar arithmetic allocates no witness unless the strict predicate passes
  // and a caller actually requests point classification.
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
  if (u <= tolerance || u >= 1 - tolerance) return false;
  const ax = oy * e1z - oz * e1y,
    ay = oz * e1x - ox * e1z,
    az = ox * e1y - oy * e1x;
  const v = (dx * ax + dy * ay + dz * az) * inverse;
  if (v <= tolerance || u + v >= 1 - tolerance) return false;
  const distance = (e2x * ax + e2y * ay + e2z * az) * inverse;
  if (!(distance > tolerance && distance < 1 - tolerance)) return false;
  return (
    acceptPoint === undefined ||
    acceptPoint([
      origin[0] + distance * dx,
      origin[1] + distance * dy,
      origin[2] + distance * dz,
    ])
  );
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

const pierces = (
  first: number[][],
  second: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
): boolean => {
  for (const [from, to] of EDGES) {
    if (
      !touchesCorner(first[from], second) &&
      !touchesCorner(first[to], second) &&
      segmentPierces(first[from], first[to], second, tolerance, acceptPoint)
    )
      return true;
    if (
      !touchesCorner(second[from], first) &&
      !touchesCorner(second[to], first) &&
      segmentPierces(second[from], second[to], first, tolerance, acceptPoint)
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
 * The inherited numerical classification excludes normal magnitudes below
 * 1e-15 and treats plane distances below 1e-9 coordinate units as coplanar.
 * These numerical cutoffs are not an exact coplanarity or disjointness proof.
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
 * `allPairs` retains every second-mesh witness for each first triangle; the
 * default stops at one. A corrective that must clear every contact uses the
 * complete population and decides which shared vertices or intended contacts
 * are exempt. Both modes use the same spatial index and triangle predicate.
 * `interiorTolerance` is a dimensionless distance from segment and triangle
 * boundaries in their own interpolation coordinates. Omission is zero, so a
 * topology validator retains its legacy numerical predicate; a face census may
 * explicitly classify sub-resolution seam residues as contact.
 * `acceptTransversePoint` classifies each strict intersection in the shared
 * frame. A rejected point does not suppress another edge or triangle witness.
 * A triangle intersection segment is straight: if both endpoint witnesses
 * belong to a convex insertion region, its whole segment belongs there.
 * Classification retains the existing strict predicate's contact exclusions;
 * it does not certify crossings that predicate does not report.
 * A resident bounding-box hierarchy visits a finite population of nodes and
 * triangles even when absolute coordinates cannot be incremented by one.
 * Candidate ordering matches the former XYZ cell walk and original second
 * ordinal wherever that walk terminated without cell-key aliasing. Overflowing
 * cell coordinates are used only for ordering, with original ordinal ties;
 * no coordinate or empty-cell range is enumerated. The narrow phase retains
 * its determinant and coplanarity cutoffs described above.
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
 * @param options Pair population and optional near-boundary contact tolerance.
 * @returns Crossings in first-triangle and spatial candidate order.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies a direction-free crossing test composable with the axis-ordered clearance measure, without depending on any catalogue item.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports crossings against the original triangle ordinals of both meshes so a caller can map them onto the buffers it owns.
 */
export function measureAutoMovieMeshCrossings(
  first: IAutoMovieMesh,
  second: IAutoMovieMesh,
  options?: IAutoMovieMeshCrossingOptions,
): IAutoMovieMeshCrossing[] {
  const allPairs = options?.allPairs === true;
  const tolerance = options?.interiorTolerance ?? 0;
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance >= 0.5)
    throw new Error(
      "Mesh crossing interior tolerance needs a finite [0, 0.5) value.",
    );
  const ours = index(first);
  const theirs = index(second);
  if (ours.length === 0 || theirs.length === 0) return [];
  // A median hierarchy bounds candidate work by resident triangle count,
  // rather than by absolute cell coordinates or the number of empty cells.
  // Every descendant is enclosed, so pruning loses no overlapping AABB.
  const hierarchy = buildAutoMovieMeshQueryHierarchy([...theirs]);
  // Preserve the previous grid's ordering wherever its cell walks terminated:
  // candidates first shared a cell in XYZ order, then original second ordinal.
  // Read that cell directly; never increment an absolute floating-point index.
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
  const crossings: IAutoMovieMeshCrossing[] = [];
  for (const triangle of ours) {
    const candidates = collectAutoMovieSpatialQueryCandidates(
      hierarchy,
      triangle,
      cell,
      "overlap",
    );
    let pierced: Indexed | undefined;
    let flat: Indexed | undefined;
    for (const candidate of candidates) {
      const acceptPoint = options?.acceptTransversePoint;
      if (
        pierces(
          triangle.corners,
          candidate.corners,
          tolerance,
          acceptPoint === undefined
            ? undefined
            : (point) => acceptPoint(point, triangle.ordinal, candidate.ordinal),
        )
      ) {
        if (allPairs) {
          crossings.push({
            triangle: triangle.ordinal,
            other: candidate.ordinal,
            coplanar: false,
          });
          continue;
        }
        pierced = candidate;
        break;
      }
      if (allPairs) {
        if (sharePlaneAndOverlap(triangle.corners, candidate.corners))
          crossings.push({
            triangle: triangle.ordinal,
            other: candidate.ordinal,
            coplanar: true,
          });
      } else if (
        flat === undefined &&
        sharePlaneAndOverlap(triangle.corners, candidate.corners)
      )
        flat = candidate;
    }
    if (allPairs) continue;
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
