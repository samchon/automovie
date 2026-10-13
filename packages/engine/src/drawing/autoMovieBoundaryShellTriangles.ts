import {
  IAutoMovieBoundaryFace,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieBoundaryFacePoint } from "./autoMovieBoundaryFacePoint";
import { triangulateAutoMoviePolygon } from "./triangulateAutoMoviePolygon";

/**
 * The closed solid one boundary's declared face stands for, as world triangles.
 *
 * A separation is a slab, not a sheet: the face outline swept along its own
 * outward normal by its stated thickness. Both caps are triangulated so the
 * solid is closed, because a plan cut through an open shell would draw only
 * the two ends of a wall, and an elevation of an open shell would draft both
 * rings where one silhouette belongs.
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
 *
 * @evidence contracts/common.md#principled-implementation An extrusion of the planar outline along local `+Z` by `thickness`: the outline is reordered counter-clockwise by the sign of its shoelace area so the quads and the far cap face outward and the near cap is reversed, and the caps come from ear clipping, which needs the simple outline that validation already guarantees for a face.
 * @evidence contracts/common.md#clear-and-simple-design One function turns one face record into a closed triangle soup and delegates placement to `autoMovieBoundaryFacePoint` and cap tessellation to `triangulateAutoMoviePolygon`, so the drafter treats a face-only boundary exactly like an element mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face, kind or thickness is special-cased; the winding is normalized from the outline's own area sign instead of trusting the authoring order, and a malformed outline is refused by the triangulator rather than drawn as a partial solid.
 * @evidence contracts/common.md#meaningful-documentation The comment states the slab reading, why both caps are closed, why caps are ear-clipped, the outward winding the silhouette pass relies on, the throwing precondition and the triangle count.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the corner count `n` for placing `2n` corners and `2n` side triangles; the dominant cost is the cap triangulation, which is quadratic in `n` and runs once for both caps because they share one index list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one face; the drafter calls it once per face-only boundary per derivation, so there is no repeated request to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh array owned by the caller and keeps no state, handle or task after returning.
 * @author Samchon
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
