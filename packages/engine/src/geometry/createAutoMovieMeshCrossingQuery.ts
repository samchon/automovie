import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieMeshCrossingGeometry as Geometry } from "./AutoMovieMeshCrossingGeometry";
import type { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";
import type { IAutoMovieMeshCrossingOptions } from "./IAutoMovieMeshCrossingOptions";
import type { IAutoMovieMeshCrossingQuery } from "./IAutoMovieMeshCrossingQuery";
import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";
import { collectAutoMovieSpatialQueryCandidates } from "./collectAutoMovieSpatialQueryCandidates";

/**
 * Snapshot one resident surface for repeated strict mesh-crossing queries.
 *
 * Every original target triangle, corner, ordinal and exact box is retained.
 * The target hierarchy and mean-extent ordering cell are prepared once. The
 * withPositions method creates independent snapshots of the same fixed index
 * layout by copying new world corners and refitting the original partition;
 * changed indices or position cardinality require a new factory call. Each
 * census reads the current first mesh in the same metre frame. Transforms are
 * caller-owned: moving a resident surface requires explicit current coordinates,
 * never a mutable mesh identity cache or an inverse local-space metric.
 *
 * The callable reports the same first-triangle/candidate order as
 * measureAutoMovieMeshCrossings. Its crosses method runs the same predicates
 * and stops on an actual transverse or coplanar witness. Mere touching or a
 * shared corner alone supplies no witness; other edges may still cross.
 * The options' dimensionless
 * interior tolerance and transverse-point classifier may remove witnesses;
 * coplanar overlap bypasses the point classifier. Open surfaces need no volume
 * admission, and a clear report supplies no containment or swept certificate.
 *
 * The unchanged numerical classification limits are a determinant/face-normal
 * cutoff of 1e-15 and coplanar plane distance below 1e-9. Construction and calls
 * refuse malformed indices or nonfinite positions; each call also refuses an
 * interior tolerance outside finite [0, 0.5). Empty surfaces are admitted and
 * return no crossings, while malformed query meshes still refuse.
 *
 * @param second Resident target snapshot in the shared metre frame.
 * @returns Callable census, early-exit predicate and fixed-index refit producer.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the existing strict Moller-Trumbore edge tests and dominant-plane overlap tests over unchanged exact triangle boxes. A resident median hierarchy prunes only disjoint boxes, and the boolean stops only after one narrow-phase witness has proved the existential result.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared geometry owner admits initial/refitted targets and current subjects; one private query builder/walk serves complete reports, boolean queries and fixed-index snapshots. The legacy one-shot census delegates to this owner rather than retaining another collision implementation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every source triangle and ordinal survives unchanged, no mesh or contact relation is exempted, and classification tolerance/callback behavior and numerical cutoffs remain explicit. No global identity cache or mutable transform cache is used.
 * @evidence contracts/development/common.md#meaningful-documentation States copied fixed indices and snapshot/refit ownership, cardinality invalidation, metres/common frame, ordering, strict touching/classification, empty/malformed admission, numerical limits and absent containment/continuous-motion guarantees.
 * @evidence contracts/development/implementation.md#efficient-algorithms For v resident coordinate scalars and s triangles, initial preparation costs O(v+s) indexing plus O(s log² s) hierarchy construction; withPositions costs O(v+s) indexing/refit/cell computation without sorting. A census indexes f current triangles and sorts k overlapping candidates per triangle in O(k log k); the boolean stops only on an actual witness. Worst-case narrow phase remains quadratic, and a poorly fitting retained partition can increase traversal work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Immutable copied target corners, ordinals, exact boxes, hierarchy and world mean-extent cell serve every call for that snapshot. Explicit fixed-index refits reuse copied indices and partition only; they replace all current geometry/bounds/cell, including every zero-area ordinal, without retaining a parent query or point-dependent verdict.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each caller-owned query retains O(s) current triangle/tree state, a shared frozen O(s) index run and the source scalar cardinality until dropped. Refits produce independent geometry without pose history; census scratch/reports are fresh and no first mesh, callback or returned report is retained.
 */
export function createAutoMovieMeshCrossingQuery(
  second: IAutoMovieMesh,
): IAutoMovieMeshCrossingQuery {
  return createQuery(Geometry.prepare(second));
}

/** A copied triangle in the shared internal geometry owner. */
type IIndexed = Geometry.ITriangle;

/** Bind the one existing narrow phase to one independent current-geometry snapshot. */
function createQuery(
  snapshot: Geometry.ISnapshot,
): IAutoMovieMeshCrossingQuery {
  const theirs: IIndexed[] = snapshot.triangles;
  const hierarchy: IAutoMovieMeshQueryHierarchy<IIndexed> | undefined =
    snapshot.hierarchy;
  const span: number =
    theirs.length === 0
      ? 0
      : theirs.reduce(
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

  /** One narrow-phase walk owns both the complete report and existential result. */
  const walk: (
    first: IAutoMovieMesh,
    options: IAutoMovieMeshCrossingOptions | undefined,
    stopAtFirst: boolean,
  ) => IAutoMovieMeshCrossing[] = (
    first: IAutoMovieMesh,
    options: IAutoMovieMeshCrossingOptions | undefined,
    stopAtFirst: boolean,
  ): IAutoMovieMeshCrossing[] => {
    const allPairs: boolean = options?.allPairs === true;
    const tolerance: number = options?.interiorTolerance ?? 0;
    if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance >= 0.5)
      throw new Error(
        "Mesh crossing interior tolerance needs a finite [0, 0.5) value.",
      );
    const ours: IIndexed[] = Geometry.index(first);
    if (ours.length === 0 || hierarchy === undefined) return [];
    const acceptTransverse: IAutoMovieMeshCrossingOptions["acceptTransversePoint"] =
      options?.acceptTransversePoint;
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
          if (stopAtFirst)
            return [
              {
                triangle: triangle.ordinal,
                other: candidate.ordinal,
                coplanar: false,
              },
            ];
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
        if (allPairs || stopAtFirst) {
          if (sharePlaneAndOverlap(triangle.corners, candidate.corners)) {
            if (stopAtFirst)
              return [
                {
                  triangle: triangle.ordinal,
                  other: candidate.ordinal,
                  coplanar: true,
                },
              ];
            crossings.push({
              triangle: triangle.ordinal,
              other: candidate.ordinal,
              coplanar: true,
            });
          }
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
  };
  const query: IAutoMovieMeshCrossingQuery = (
    first: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): IAutoMovieMeshCrossing[] => walk(first, options, false);
  query.crosses = (
    first: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): boolean => walk(first, options, true).length > 0;
  query.withPositions = (
    positions: readonly number[],
  ): IAutoMovieMeshCrossingQuery =>
    createQuery(Geometry.withPositions(snapshot, positions));
  return query;
}

/**
 * Bounded Moller-Trumbore: whether the open segment from `origin` to `target`
 * passes strictly through the triangle's interior. Every bound is strict,
 * widened inward by the caller's tolerance, so a segment ending on the surface
 * or sharing a corner passes through nothing. A determinant below 1e-15 is
 * treated as parallel and left to the coplanar test.
 */
const segmentPierces: (
  origin: number[],
  target: number[],
  triangle: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
) => boolean = (
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
const coincide: (a: number[], b: number[]) => boolean = (
  a: number[],
  b: number[],
): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Whether a point is exactly one of the triangle's corners. The barycentric
 * coordinates of a shared corner come out as a rounding residue rather than an
 * exact zero, so two triangles of one surface sharing a vertex could report
 * each other; the shared corner is excluded by identity before the arithmetic.
 */
const touchesCorner: (point: number[], triangle: number[][]) => boolean = (
  point: number[],
  triangle: number[][],
): boolean =>
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
const pierces: (
  first: number[][],
  second: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
) => boolean = (
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
const dominant: (normal: number[]) => number = (normal: number[]): number =>
  [0, 1, 2].reduce((best: number, axis: number): number =>
    Math.abs(normal[axis]!) > Math.abs(normal[best]!) ? axis : best,
  );

/** A point with one axis dropped. */
const flatten: (point: number[], drop: number) => number[] = (
  point: number[],
  drop: number,
): number[] =>
  [0, 1, 2]
    .filter((axis: number): boolean => axis !== drop)
    .map((axis: number): number => point[axis]!);

/** Twice the signed area of `(a, b, p)` in a flattened plane. */
const side: (a: number[], b: number[], p: number[]) => number = (
  a: number[],
  b: number[],
  p: number[],
): number =>
  (b[0]! - a[0]!) * (p[1]! - a[1]!) - (b[1]! - a[1]!) * (p[0]! - a[0]!);

/** Whether a flattened point lies strictly inside a flattened triangle. */
const within: (triangle: number[][], point: number[]) => boolean = (
  triangle: number[][],
  point: number[],
): boolean => {
  const signs: number[] = [0, 1, 2].map((corner: number): number =>
    side(triangle[corner]!, triangle[(corner + 1) % 3]!, point),
  );
  return (
    signs.every((value: number): boolean => value > 0) ||
    signs.every((value: number): boolean => value < 0)
  );
};

/** Whether two flattened segments cross at a point interior to both. */
const segmentsMeet: (
  a: number[],
  b: number[],
  c: number[],
  d: number[],
) => boolean = (a: number[], b: number[], c: number[], d: number[]): boolean =>
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
const sharePlaneAndOverlap: (
  first: number[][],
  second: number[][],
) => boolean = (first: number[][], second: number[][]): boolean => {
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
