import {
  IAutoMovieBoundaryFace,
  type IAutoMovieDrawingTriangle,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { autoMovieBoundaryFacePoint } from "./autoMovieBoundaryFacePoint";
import { triangulateAutoMoviePolygon } from "./triangulateAutoMoviePolygon";

/**
 * The closed solid one boundary's declared face stands for, as world triangles.
 *
 * A separation is a slab, not a sheet: the face outline swept along its own
 * outward normal by its stated thickness. Both caps are triangulated so the
 * solid is closed, because a plan cut through an open shell would draw only the
 * two ends of a wall, and an elevation of an open shell would draft both rings
 * where one silhouette belongs.
 *
 * The outline may be concave, so the caps are ear-clipped by
 * {@link triangulateAutoMoviePolygon} rather than fanned from one corner, which
 * would put triangles outside an L-shaped soffit. Every triangle is wound
 * outward, which the silhouette pass reads as facing. The face must be the
 * validated record: an outline that is not a simple polygon of at least three
 * corners makes the triangulation throw.
 *
 * @param face Boundary face giving the rigid frame, outline and thickness.
 * @returns `2n` side triangles and `2(n - 2)` cap triangles for an `n`-corner
 *   outline, in world metres.
 */
export const autoMovieBoundaryShellTriangles = (
  face: IAutoMovieBoundaryFace,
): IAutoMovieDrawingTriangle[] => {
  const outline: readonly IAutoMoviePlanarPoint[] =
    polygonDoubleArea(face.outline) < 0
      ? [...face.outline].reverse()
      : face.outline;
  const near: IAutoMovieVector3[] = outline.map(
    (point: IAutoMoviePlanarPoint): IAutoMovieVector3 =>
      autoMovieBoundaryFacePoint(face, point, 0),
  );
  const far: IAutoMovieVector3[] = outline.map(
    (point: IAutoMoviePlanarPoint): IAutoMovieVector3 =>
      autoMovieBoundaryFacePoint(face, point, face.thickness),
  );
  const triangles: IAutoMovieDrawingTriangle[] = [];
  for (let index: number = 0; index < outline.length; ++index) {
    const next: number = (index + 1) % outline.length;
    triangles.push(
      { a: near[index]!, b: near[next]!, c: far[next]! },
      { a: near[index]!, b: far[next]!, c: far[index]! },
    );
  }
  for (const [first, second, third] of triangulateAutoMoviePolygon(outline)) {
    triangles.push({ a: far[first]!, b: far[second]!, c: far[third]! });
    triangles.push({ a: near[third]!, b: near[second]!, c: near[first]! });
  }
  return triangles;
};
