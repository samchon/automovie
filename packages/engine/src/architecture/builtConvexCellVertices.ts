import { IAutoMovieConvexSpaceCell, IAutoMovieVector3 } from "@automovie/interface";
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
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Turns a stated space volume into the points an observation station can be measured against.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Derives the convex-cell corner set the interior station rule reads.
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
