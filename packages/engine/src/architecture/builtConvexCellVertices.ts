import {
  IAutoMovieConvexSpaceCell,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";

/**
 * A half-space `dot(normal, point) <= offset`.
 *
 * @author Samchon
 */
interface IPlane {
  /** Outward normal; unit length once read through {@link unitPlane}. */
  normal: IAutoMovieVector3;

  /** Offset along the normal, scaled with it. */
  offset: number;
}

/** Read a plane as a unit normal and its matching offset, or null if degenerate. */
const unitPlane: (plane: IPlane) => IPlane | null = (plane: IPlane): IPlane | null => {
  const length: number = Vector3.length(plane.normal);
  if (length <= AUTOMOVIE_OBSERVATION_EPSILON) return null;
  return {
    normal: Vector3.scale(plane.normal, 1 / length),
    offset: plane.offset / length,
  };
};

/**
 * The corner points of one convex cell's own half-space intersection.
 *
 * A cell is stated as the planes that cut it rather than as the shape those planes leave, so every question about where the room actually is starts by solving them. Each triple of planes meets at one point when their normals are independent, and the point belongs to the cell when every other plane admits it. Unbounded cells simply produce fewer points, which is the honest answer for a half-space that closes nothing.
 *
 * Planes are normalized first, a plane whose normal is shorter than `AUTOMOVIE_OBSERVATION_EPSILON` is ignored, a triple whose normals' determinant is within that tolerance of zero yields no point, a point outside any plane by more than it is dropped, and corners closer than it are merged. Points are world-space in metres, in the order their first plane triple was found.
 *
 * @evidence contracts/common.md#principled-implementation Solves each plane triple by Cramer's rule in its cross-product form, `(b×c·d₁ + c×a·d₂ + a×b·d₃) / a·(b×c)`, then tests every half-space. Normalization gives admission distances in metres; the determinant is dimensionless and uses the same numeric epsilon as a separate near-parallel heuristic. Binary64 rounding, non-finite intermediates and skipped near-parallel triples can lose corners; enumeration does not certify boundedness.
 * @evidence contracts/common.md#clear-and-simple-design One vertex enumeration that the observation stations and the space volume bounds read, returning bare points so each caller decides whether it needs a centroid, bounds or hull.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no cell or space; an unbounded or empty cell answers fewer or no points by the same rules rather than an invented box, and the tolerance is the shared observation constant.
 * @evidence contracts/common.md#meaningful-documentation States why cells are solved, the triple and admission rules, every tolerance use, the unbounded case, and the frame, unit and order of the points.
 * @evidence contracts/performance.md#efficient-algorithms For N input planes, P retained planes and at most K retained corners, O(N + P³(P + K)) time: normalization visits all inputs, and each triple can scan every retained plane and corner for admission and duplicate suppression. K is at most the number of retained triples; no measured advantage over a hull algorithm is asserted.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one cell that coordinates no work across calls; a caller reading one cell repeatedly owns any reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned points, at most one per plane triple.
 */
export const builtConvexCellVertices: (cell: IAutoMovieConvexSpaceCell) => IAutoMovieVector3[] = (
  cell: IAutoMovieConvexSpaceCell,
): IAutoMovieVector3[] => {
  const planes: IPlane[] = [];
  for (const plane of cell.planes) {
    const unit: IPlane | null = unitPlane(plane);
    if (unit !== null) planes.push(unit);
  }
  const vertices: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < planes.length; i++)
    for (let j: number = i + 1; j < planes.length; j++)
      for (let k: number = j + 1; k < planes.length; k++) {
        const a: IPlane = planes[i]!;
        const b: IPlane = planes[j]!;
        const c: IPlane = planes[k]!;
        const bc: IAutoMovieVector3 = Vector3.cross(b.normal, c.normal);
        const determinant: number = Vector3.dot(a.normal, bc);
        if (Math.abs(determinant) <= AUTOMOVIE_OBSERVATION_EPSILON) continue;
        const point: IAutoMovieVector3 = Vector3.scale(
          Vector3.add(
            Vector3.add(
              Vector3.scale(bc, a.offset),
              Vector3.scale(Vector3.cross(c.normal, a.normal), b.offset),
            ),
            Vector3.scale(Vector3.cross(a.normal, b.normal), c.offset),
          ),
          1 / determinant,
        );
        if (
          planes.some(
            (plane: IPlane): boolean =>
              Vector3.dot(plane.normal, point) >
              plane.offset + AUTOMOVIE_OBSERVATION_EPSILON,
          )
        )
          continue;
        if (
          vertices.some(
            (known: IAutoMovieVector3): boolean =>
              Vector3.length(Vector3.subtract(known, point)) <=
              AUTOMOVIE_OBSERVATION_EPSILON,
          )
        )
          continue;
        vertices.push(point);
      }
  return vertices;
};
