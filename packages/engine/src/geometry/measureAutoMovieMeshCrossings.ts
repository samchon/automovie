import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";
import type { IAutoMovieMeshCrossingOptions } from "./IAutoMovieMeshCrossingOptions";
import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";
import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";
import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";
import { collectAutoMovieSpatialQueryCandidates } from "./collectAutoMovieSpatialQueryCandidates";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Report every triangle of `first` that a triangle of `second` crosses.
 *
 * Both meshes share one metre frame and are only read. An entry names the
 * first-mesh triangle, one second-mesh witness, and whether the pair crosses
 * transversally or overlaps flat in one plane; it is empty when the surfaces
 * are disjoint or merely touch. Entries follow first-mesh ordinal, and the
 * witness is the first crossing candidate in the order
 * `collectAutoMovieSpatialQueryCandidates` gives: the first grid cell, at the
 * second mesh's mean triangle size, the pair shares in X, Y, Z order, then the
 * second ordinal. A transverse witness is preferred over a coplanar one. With
 * `allPairs` every crossing witness is reported instead, which a corrective
 * that must clear every contact needs; it then decides which shared vertices
 * or intended contacts are exempt.
 *
 * Touching is not crossing. Two shells meeting along a seam share vertices and
 * edges by construction, so every test is strict: a triangle edge pierces only
 * strictly inside both the edge and the other triangle, a segment ending at or
 * starting from the other triangle's corner is excluded by exact coordinate
 * identity before any arithmetic, and coplanar triangles overlap only through
 * properly crossing edges or strict containment. A fold through a shared
 * corner still reports, because its other edges cross. `interiorTolerance`, a
 * dimensionless margin in [0, 0.5) of the edge and triangle coordinates, lets a
 * caller classify sub-resolution seam residues as contact; omitted, it is zero.
 * `acceptTransversePoint` sees each strict transverse intersection point and
 * may reject it, which removes that one witness and continues with the other
 * edges and candidates; it cannot add a crossing the strict test did not find.
 *
 * The numerical cutoffs are classification thresholds, not proofs: a
 * Moller-Trumbore determinant below 1e-15 counts as parallel and is left to the
 * coplanar test, a face normal shorter than 1e-15 is never coplanar, and plane
 * distances below 1e-9 count as in-plane. This measures overlap only, not
 * depth, which `measureAutoMovieMeshClearance` gives along a chosen axis, nor
 * which surface should move. Passing one mesh as both arguments tests it for
 * self-intersection, as `measureAutoMovieModelCrossings` does with
 * `withinParts`. Throws on a malformed index buffer, a non-finite position or
 * a tolerance outside [0, 0.5).
 *
 * @param first Mesh whose triangles are reported.
 * @param second Mesh tested against it, in the same frame.
 * @param options Pair population, contact tolerance and point classifier.
 * @returns Crossings in first-triangle and candidate order.
 *
 * @evidence contracts/common.md#principled-implementation Two triangles cross transversally exactly when an edge of one pierces the other, which bounded Moller-Trumbore decides per edge, and coplanar triangles overlap exactly when their edges properly cross or one contains the other, decided in the plane of largest projected area; a median box hierarchy restricts each test to triangles whose boxes overlap.
 * @evidence contracts/common.md#clear-and-simple-design The census owns the narrow phase and witness selection, while the shared `buildAutoMovieMeshQueryHierarchy` and `collectAutoMovieSpatialQueryCandidates` own the broad phase and its deterministic order, so lash contact and this census walk one spatial index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared corners are excluded by exact identity rather than by widening every bound, the tolerance and classifier are caller-declared and can only remove witnesses, and the three numerical cutoffs are named as classification limits rather than presented as proofs.
 * @evidence contracts/common.md#meaningful-documentation States the frame, what an entry means and when the result is empty, the ordering and witness rule, `allPairs`, the strict touching rule, both options' semantics, the numerical cutoffs, what it does not measure, the self-test use, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For f first and s second triangles, the second hierarchy costs O(s log^2 s) and each first triangle collects only candidates whose boxes overlap its own, sorting them in O(k log k), with a constant-time narrow phase per candidate; the default mode stops at the first transverse witness.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call measures one pair of meshes in their current positions; the model census calls it per part pair and nothing is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds both meshes' triangle records and the second hierarchy for the call and returns one record per crossing; the point classifier receives a fresh array per strict intersection only when supplied.
 * @author Samchon
 */
export function measureAutoMovieMeshCrossings(
  first: IAutoMovieMesh,
  second: IAutoMovieMesh,
  options?: IAutoMovieMeshCrossingOptions,
): IAutoMovieMeshCrossing[] {
  const allPairs: boolean = options?.allPairs === true;
  const tolerance: number = options?.interiorTolerance ?? 0;
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance >= 0.5)
    throw new Error(
      "Mesh crossing interior tolerance needs a finite [0, 0.5) value.",
    );
  const ours: IIndexed[] = index(first);
  const theirs: IIndexed[] = index(second);
  if (ours.length === 0 || theirs.length === 0) return [];
  const hierarchy: IAutoMovieMeshQueryHierarchy<IIndexed> =
    buildAutoMovieMeshQueryHierarchy([...theirs]);
  // The ordering cell is the second mesh's mean largest triangle extent, so
  // a candidate's cell reflects how many triangles away it lies.
  const span: number =
    theirs.reduce(
      (total: number, triangle: IIndexed): number =>
        total +
        Math.max(
          triangle.high[0]! - triangle.low[0]!,
          triangle.high[1]! - triangle.low[1]!,
          triangle.high[2]! - triangle.low[2]!,
        ),
      0,
    ) / theirs.length;
  const cell: number = span > 0 ? span : 1;
  const acceptTransverse:
    | IAutoMovieMeshCrossingOptions["acceptTransversePoint"]
    | undefined = options?.acceptTransversePoint;
  const crossings: IAutoMovieMeshCrossing[] = [];
  for (const triangle of ours) {
    const candidates: IIndexed[] = collectAutoMovieSpatialQueryCandidates(
      hierarchy,
      triangle,
      cell,
      "overlap",
    );
    let pierced: IIndexed | undefined;
    let flat: IIndexed | undefined;
    for (const candidate of candidates) {
      if (
        pierces(
          triangle.corners,
          candidate.corners,
          tolerance,
          acceptTransverse === undefined
            ? undefined
            : (point: readonly number[]): boolean =>
                acceptTransverse(point, triangle.ordinal, candidate.ordinal),
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
    const witness: IIndexed | undefined = pierced ?? flat;
    if (witness !== undefined)
      crossings.push({
        triangle: triangle.ordinal,
        other: witness.ordinal,
        coplanar: pierced === undefined,
      });
  }
  return crossings;
}

/** One triangle's corners with the box and ordinal the spatial index reads. */
interface IIndexed extends IAutoMovieSpatialQueryEntry {
  /** The three corners as XYZ arrays. */
  corners: number[][];
}

/** Admit a mesh and record each triangle's corners and box. */
const index = (mesh: IAutoMovieMesh): IIndexed[] => {
  const indices: number[] = triangleIndicesOf(
    mesh,
    "Mesh crossings (complete triangle buffers)",
  );
  if (!mesh.positions.every(Number.isFinite))
    throw new Error("Mesh crossings need finite complete triangle buffers.");
  const at = (vertex: number): number[] => [
    mesh.positions[vertex * 3]!,
    mesh.positions[vertex * 3 + 1]!,
    mesh.positions[vertex * 3 + 2]!,
  ];
  const out: IIndexed[] = [];
  for (let t: number = 0; t < indices.length; t += 3) {
    const a: number[] = at(indices[t]!);
    const b: number[] = at(indices[t + 1]!);
    const c: number[] = at(indices[t + 2]!);
    const low: number[] = [0, 1, 2].map((axis: number): number =>
      Math.min(a[axis]!, b[axis]!, c[axis]!),
    );
    const high: number[] = [0, 1, 2].map((axis: number): number =>
      Math.max(a[axis]!, b[axis]!, c[axis]!),
    );
    out.push({
      ordinal: t / 3,
      corners: [a, b, c],
      low,
      high,
      // Half-sums keep finite endpoints finite, even when high - low overflows.
      // Centres choose the partition only; exact corner extrema bound it.
      centre: [0, 1, 2].map(
        (axis: number): number => low[axis]! / 2 + high[axis]! / 2,
      ),
    });
  }
  return out;
};

/**
 * Bounded Moller-Trumbore: whether the open segment from `origin` to `target`
 * passes strictly through the triangle's interior. Every bound is strict,
 * widened inward by the caller's tolerance, so a segment ending on the surface
 * or sharing a corner passes through nothing. A determinant below 1e-15 is
 * treated as parallel and left to the coplanar test.
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
  const t0: number[] = triangle[0]!;
  const t1: number[] = triangle[1]!;
  const t2: number[] = triangle[2]!;
  const e1x: number = t1[0]! - t0[0]!;
  const e1y: number = t1[1]! - t0[1]!;
  const e1z: number = t1[2]! - t0[2]!;
  const e2x: number = t2[0]! - t0[0]!;
  const e2y: number = t2[1]! - t0[1]!;
  const e2z: number = t2[2]! - t0[2]!;
  const dx: number = target[0]! - origin[0]!;
  const dy: number = target[1]! - origin[1]!;
  const dz: number = target[2]! - origin[2]!;
  const px: number = dy * e2z - dz * e2y;
  const py: number = dz * e2x - dx * e2z;
  const pz: number = dx * e2y - dy * e2x;
  const determinant: number = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(determinant) < 1e-15) return false;
  const inverse: number = 1 / determinant;
  const ox: number = origin[0]! - t0[0]!;
  const oy: number = origin[1]! - t0[1]!;
  const oz: number = origin[2]! - t0[2]!;
  const u: number = (ox * px + oy * py + oz * pz) * inverse;
  if (u <= tolerance || u >= 1 - tolerance) return false;
  const ax: number = oy * e1z - oz * e1y;
  const ay: number = oz * e1x - ox * e1z;
  const az: number = ox * e1y - oy * e1x;
  const v: number = (dx * ax + dy * ay + dz * az) * inverse;
  if (v <= tolerance || u + v >= 1 - tolerance) return false;
  const distance: number = (e2x * ax + e2y * ay + e2z * az) * inverse;
  if (!(distance > tolerance && distance < 1 - tolerance)) return false;
  return (
    acceptPoint === undefined ||
    acceptPoint([
      origin[0]! + distance * dx,
      origin[1]! + distance * dy,
      origin[2]! + distance * dz,
    ])
  );
};

/** Whether two points have exactly the same coordinates. */
const coincide = (a: number[], b: number[]): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Whether a point is exactly one of the triangle's corners. The barycentric
 * coordinates of a shared corner come out as a rounding residue rather than an
 * exact zero, so two triangles of one surface sharing a vertex could report
 * each other; the shared corner is excluded by identity before the arithmetic.
 */
const touchesCorner = (point: number[], triangle: number[][]): boolean =>
  coincide(point, triangle[0]!) ||
  coincide(point, triangle[1]!) ||
  coincide(point, triangle[2]!);

/** The three edges of a triangle as corner index pairs. */
const EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

/** Whether any edge of either triangle strictly pierces the other. */
const pierces = (
  first: number[][],
  second: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
): boolean => {
  for (const [from, to] of EDGES) {
    if (
      !touchesCorner(first[from]!, second) &&
      !touchesCorner(first[to]!, second) &&
      segmentPierces(first[from]!, first[to]!, second, tolerance, acceptPoint)
    )
      return true;
    if (
      !touchesCorner(second[from]!, first) &&
      !touchesCorner(second[to]!, first) &&
      segmentPierces(second[from]!, second[to]!, first, tolerance, acceptPoint)
    )
      return true;
  }
  return false;
};

/** The axis to drop when flattening a plane with this normal, keeping area. */
const dominant = (normal: number[]): number =>
  [0, 1, 2].reduce(
    (best: number, axis: number): number =>
      Math.abs(normal[axis]!) > Math.abs(normal[best]!) ? axis : best,
  );

/** A point with one axis dropped. */
const flatten = (point: number[], drop: number): number[] =>
  [0, 1, 2]
    .filter((axis: number): boolean => axis !== drop)
    .map((axis: number): number => point[axis]!);

/** Twice the signed area of `(a, b, p)` in a flattened plane. */
const side = (a: number[], b: number[], p: number[]): number =>
  (b[0]! - a[0]!) * (p[1]! - a[1]!) - (b[1]! - a[1]!) * (p[0]! - a[0]!);

/** Whether a flattened point lies strictly inside a flattened triangle. */
const within = (triangle: number[][], point: number[]): boolean => {
  const signs: number[] = [0, 1, 2].map((corner: number): number =>
    side(triangle[corner]!, triangle[(corner + 1) % 3]!, point),
  );
  return (
    signs.every((value: number): boolean => value > 0) ||
    signs.every((value: number): boolean => value < 0)
  );
};

/** Whether two flattened segments cross at a point interior to both. */
const segmentsMeet = (
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): boolean =>
  side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;

/**
 * True when two triangles lie in one plane and their areas overlap.
 *
 * Coplanarity alone is not a crossing: two triangles can share a plane and sit
 * apart. Overlap is decided in the plane by properly crossing edges or by
 * either triangle strictly containing the other's first corner, which together
 * cover partial overlap and full containment, and both tests are strict so a
 * shared corner or edge is touching, not overlapping. Normals shorter than
 * 1e-15 never count, and plane distances below 1e-9 count as in-plane.
 */
const sharePlaneAndOverlap = (
  first: number[][],
  second: number[][],
): boolean => {
  // The rejection almost every candidate takes, written out as scalars.
  const f0: number[] = first[0]!;
  const f1: number[] = first[1]!;
  const f2: number[] = first[2]!;
  const ux: number = f1[0]! - f0[0]!;
  const uy: number = f1[1]! - f0[1]!;
  const uz: number = f1[2]! - f0[2]!;
  const vx: number = f2[0]! - f0[0]!;
  const vy: number = f2[1]! - f0[1]!;
  const vz: number = f2[2]! - f0[2]!;
  const nx: number = uy * vz - uz * vy;
  const ny: number = uz * vx - ux * vz;
  const nz: number = ux * vy - uy * vx;
  const length: number = Math.hypot(nx, ny, nz);
  if (length < 1e-15) return false;
  for (const point of second)
    if (
      !(
        Math.abs(
          ((point[0]! - f0[0]!) * nx +
            (point[1]! - f0[1]!) * ny +
            (point[2]! - f0[2]!) * nz) /
            length,
        ) < 1e-9
      )
    )
      return false;
  const drop: number = dominant([nx, ny, nz]);
  const here: number[][] = first.map((point: number[]): number[] =>
    flatten(point, drop),
  );
  const there: number[][] = second.map((point: number[]): number[] =>
    flatten(point, drop),
  );
  if (within(here, there[0]!) || within(there, here[0]!)) return true;
  for (let a: number = 0; a < 3; a++)
    for (let b: number = 0; b < 3; b++)
      if (
        segmentsMeet(
          here[a]!,
          here[(a + 1) % 3]!,
          there[b]!,
          there[(b + 1) % 3]!,
        )
      )
        return true;
  return false;
};
