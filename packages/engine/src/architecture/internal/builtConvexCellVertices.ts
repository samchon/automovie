import {
  IAutoMovieConvexSpaceCell,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { ObservationGeometry } from "./ObservationGeometry";

/*
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
 * ObservationGeometry.Epsilon is ignored, a triple whose normals'
 * determinant is within that tolerance of zero yields no point, a point outside
 * any plane by more than it is dropped, and corners closer than it are merged.
 * Points are world-space in metres, in the order their first plane triple was
 * found.
 */
export function builtConvexCellVertices(
  cell: IAutoMovieConvexSpaceCell,
): IAutoMovieVector3[] {
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
        const bc: IAutoMovieVector3 = AutoMovieEngineVector3.cross(b.normal, c.normal);
        const determinant: number = AutoMovieEngineVector3.dot(a.normal, bc);
        if (Math.abs(determinant) <= ObservationGeometry.Epsilon) continue;
        const point: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.add(
              AutoMovieEngineVector3.scale(bc, a.offset),
              AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(c.normal, a.normal), b.offset),
            ),
            AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(a.normal, b.normal), c.offset),
          ),
          1 / determinant,
        );
        if (
          planes.some(
            (plane: IPlane): boolean =>
              AutoMovieEngineVector3.dot(plane.normal, point) >
              plane.offset + ObservationGeometry.Epsilon,
          )
        )
          continue;
        if (
          vertices.some(
            (known: IAutoMovieVector3): boolean =>
              AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(known, point)) <=
              ObservationGeometry.Epsilon,
          )
        )
          continue;
        vertices.push(point);
      }
  return vertices;
}

/*
 * A half-space `dot(normal, point) <= offset`.
 */
interface IPlane {
  /*
   * Outward normal; unit length once read through unitPlane.
   */
  normal: IAutoMovieVector3;

  /*
   * Offset along the normal, scaled with it.
   */
  offset: number;
}

/*
 * Read a plane as a unit normal and its matching offset, or null if degenerate.
 */
function unitPlane(plane: IPlane): IPlane | null {
  const length: number = AutoMovieEngineVector3.length(plane.normal);
  if (length <= ObservationGeometry.Epsilon) return null;
  return {
    normal: AutoMovieEngineVector3.scale(plane.normal, 1 / length),
    offset: plane.offset / length,
  };
}
