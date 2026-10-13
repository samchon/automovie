import {
  IAutoMovieConvexSpaceCell,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";

/** Read a plane as a unit normal and its matching offset, or null if degenerate. */
const unitPlane = (plane: {
  normal: IAutoMovieVector3;
  offset: number;
}): { normal: IAutoMovieVector3; offset: number } | null => {
  const length = Vector3.length(plane.normal);
  if (length <= AUTOMOVIE_OBSERVATION_EPSILON) return null;
  return {
    normal: Vector3.scale(plane.normal, 1 / length),
    offset: plane.offset / length,
  };
};

/**
 * The corner points of one convex cell's own half-space intersection.
 *
 * A cell is stated as the planes that cut it rather than as the shape those
 * planes leave, so every question about where the room actually is starts by
 * solving them. Each triple of planes meets at one point when their normals are
 * independent, and the point belongs to the cell when every other plane admits
 * it. Unbounded cells simply produce fewer points, which is the honest answer
 * for a half-space that closes nothing.
 *
 * Planes are normalized first, a plane whose normal is shorter than
 * `AUTOMOVIE_OBSERVATION_EPSILON` is ignored, and corners closer than that
 * tolerance are merged. Points are world-space and unordered.
 *
 * @evidence contracts/common.md#principled-implementation Solves every triple of normalized planes by Cramer's rule with determinant `a · (b x c)`, skips near-singular triples, keeps a point every plane admits within `AUTOMOVIE_OBSERVATION_EPSILON`, and merges duplicates where several planes meet at one corner.
 * @evidence contracts/common.md#clear-and-simple-design One exported solver with a private plane normalizer, shared by the volume-bounds and observation-station queries; `describeAutoMovieSubject` and `describeAutoMovieSubjects` still carry their own triple-intersection solver with a different tolerance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No plane count or axis alignment is special-cased; dropping degenerate normals and merging coincident corners are the only compensations, both decided by the one observation tolerance.
 * @evidence contracts/common.md#meaningful-documentation States why a cell needs solving, the triple-intersection method, the membership rule, the tolerance used for degenerate planes and duplicates, the frame, and that an unbounded cell returns fewer points.
 * @evidence contracts/performance.md#cost-and-resources Cubic in plane count for the triples, and each candidate adds a linear admission test and a linear duplicate scan over corners found so far, `O(P^4)` worst case on a cell of a handful of planes; results are not cached, so `builtSpaceObservationStations` can solve one cell twice.
 */
export const builtConvexCellVertices = (
  cell: IAutoMovieConvexSpaceCell,
): IAutoMovieVector3[] => {
  const planes = cell.planes
    .map(unitPlane)
    .filter((plane): plane is { normal: IAutoMovieVector3; offset: number } =>
      Boolean(plane),
    );
  const vertices: IAutoMovieVector3[] = [];
  for (let i = 0; i < planes.length; i++)
    for (let j = i + 1; j < planes.length; j++)
      for (let k = j + 1; k < planes.length; k++) {
        const a = planes[i]!;
        const b = planes[j]!;
        const c = planes[k]!;
        const bc = Vector3.cross(b.normal, c.normal);
        const determinant = Vector3.dot(a.normal, bc);
        if (Math.abs(determinant) <= AUTOMOVIE_OBSERVATION_EPSILON) continue;
        const point = Vector3.scale(
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
            (plane) =>
              Vector3.dot(plane.normal, point) >
              plane.offset + AUTOMOVIE_OBSERVATION_EPSILON,
          )
        )
          continue;
        if (
          vertices.some(
            (known) =>
              Vector3.length(Vector3.subtract(known, point)) <=
              AUTOMOVIE_OBSERVATION_EPSILON,
          )
        )
          continue;
        vertices.push(point);
      }
  return vertices;
};
