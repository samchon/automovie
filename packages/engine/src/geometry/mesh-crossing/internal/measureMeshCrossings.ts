import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshCrossingOptions,
  IAutoMovieMeshQueryHierarchy,
} from "@automovie/interface";

import { collectSpatialQueryCandidates } from "../../internal/collectSpatialQueryCandidates";
import { AutoMovieMeshCrossingGeometry } from "./AutoMovieMeshCrossingGeometry";
import type { IAutoMovieMeshCrossingTriangle } from "./IAutoMovieMeshCrossingTriangle";

/*
 * Walk the same candidates and predicates for a full census or one witness.
 */
export function measureMeshCrossings(
  hierarchy:
    | IAutoMovieMeshQueryHierarchy<IAutoMovieMeshCrossingTriangle>
    | undefined,
  cell: number,
  first: IAutoMovieMesh,
  options: IAutoMovieMeshCrossingOptions | undefined,
  stopAtFirst: boolean,
): IAutoMovieMeshCrossing[] {
  const allPairs: boolean = options?.allPairs === true;
  const tolerance: number = options?.interiorTolerance ?? 0;
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance >= 0.5)
    throw new Error(
      "Mesh crossing interior tolerance needs a finite [0, 0.5) value.",
    );
  const ours: IAutoMovieMeshCrossingTriangle[] =
    AutoMovieMeshCrossingGeometry.index(first);
  if (ours.length === 0 || hierarchy === undefined) return [];
  const acceptTransverse: IAutoMovieMeshCrossingOptions["acceptTransversePoint"] =
    options?.acceptTransversePoint;
  const crossings: IAutoMovieMeshCrossing[] = [];
  for (const triangle of ours) {
    const candidates: IAutoMovieMeshCrossingTriangle[] =
      collectSpatialQueryCandidates(
        hierarchy,
        triangle,
        cell,
        "overlap",
      );
    let pierced: IAutoMovieMeshCrossingTriangle | undefined;
    let flat: IAutoMovieMeshCrossingTriangle | undefined;
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
    const witness: IAutoMovieMeshCrossingTriangle | undefined = pierced ?? flat;
    if (witness !== undefined)
      crossings.push({
        triangle: triangle.ordinal,
        other: witness.ordinal,
        coplanar: pierced === undefined,
      });
  }
  return crossings;
}

/*
 * Bounded Moller-Trumbore: whether the open segment from `origin` to `target`
 * passes strictly through the triangle's interior. Every bound is strict,
 * widened inward by the caller's tolerance, so a segment ending on the surface
 * or sharing a corner passes through nothing. A determinant below 1e-15 is
 * treated as parallel and left to the coplanar test.
 */
function segmentPierces(
  origin: number[],
  target: number[],
  triangle: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
): boolean {
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
}

/*
 * Whether two points have exactly the same coordinates.
 */
function coincide(a: number[], b: number[]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/*
 * Whether a point is exactly one of the triangle's corners. The barycentric
 * coordinates of a shared corner come out as a rounding residue rather than an
 * exact zero, so two triangles of one surface sharing a vertex could report
 * each other; the shared corner is excluded by identity before the arithmetic.
 */
function touchesCorner(point: number[], triangle: number[][]): boolean {
  return (
    coincide(point, triangle[0]!) ||
    coincide(point, triangle[1]!) ||
    coincide(point, triangle[2]!)
  );
}

/*
 * The three edges of a triangle as corner index pairs.
 */
const EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

/*
 * Whether any edge of either triangle strictly pierces the other.
 */
function pierces(
  first: number[][],
  second: number[][],
  tolerance: number,
  acceptPoint?: (point: readonly number[]) => boolean,
): boolean {
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
}

/*
 * The axis to drop when flattening a plane with this normal, keeping area.
 */
function dominant(normal: number[]): number {
  return [0, 1, 2].reduce((best: number, axis: number): number =>
    Math.abs(normal[axis]!) > Math.abs(normal[best]!) ? axis : best,
  );
}

/*
 * A point with one axis dropped.
 */
function flatten(point: number[], drop: number): number[] {
  return [0, 1, 2]
    .filter((axis: number): boolean => axis !== drop)
    .map((axis: number): number => point[axis]!);
}

/*
 * Twice the signed area of `(a, b, p)` in a flattened plane.
 */
function side(a: number[], b: number[], p: number[]): number {
  return (b[0]! - a[0]!) * (p[1]! - a[1]!) - (b[1]! - a[1]!) * (p[0]! - a[0]!);
}

/*
 * Whether a flattened point lies strictly inside a flattened triangle.
 */
function within(triangle: number[][], point: number[]): boolean {
  const signs: number[] = [0, 1, 2].map((corner: number): number =>
    side(triangle[corner]!, triangle[(corner + 1) % 3]!, point),
  );
  return (
    signs.every((value: number): boolean => value > 0) ||
    signs.every((value: number): boolean => value < 0)
  );
}

/*
 * Whether two flattened segments cross at a point interior to both.
 */
function segmentsMeet(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): boolean {
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

/*
 * True when two triangles lie in one plane and their areas overlap.
 *
 * Coplanarity alone is not a crossing: two triangles can share a plane and sit
 * apart. Overlap is decided in the plane by properly crossing edges or by
 * either triangle strictly containing the other's first corner, which together
 * cover partial overlap and full containment, and both tests are strict so a
 * shared corner or edge is touching, not overlapping. Normals shorter than
 * 1e-15 never count, and plane distances below 1e-9 count as in-plane.
 */
function sharePlaneAndOverlap(first: number[][], second: number[][]): boolean {
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
}
