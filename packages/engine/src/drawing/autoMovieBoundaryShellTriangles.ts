import { IAutoMovieBoundaryFace } from "@automovie/interface";
import { polygonDoubleArea } from "../architecture/polygonDoubleArea";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieBoundaryFacePoint } from "./autoMovieBoundaryFacePoint";
import { triangulateAutoMoviePolygon } from "./triangulateAutoMoviePolygon";

/**
 * The closed solid one boundary's declared face stands for.
 *
 * A separation is a slab, not a sheet: the face outline swept along its own
 * outward normal by its stated thickness. The solid is closed on purpose — both
 * caps are triangulated — because a plan cut through an open shell would draw
 * only the two ends of a wall and leave its faces off the sheet, and an
 * elevation of an open shell would draft both rings where one silhouette
 * belongs.
 *
 * The outline may be concave, so the caps are ear-clipped rather than fanned: a
 * fan from one corner of an L-shaped soffit puts triangles outside the soffit,
 * and a cut through those would draw walls nobody built.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Turns a declared boundary face and thickness into the closed solid whose sections and silhouettes appear on architectural drawings.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Builds outward-wound side faces and ear-clipped near and far caps from the face outline at its two depth planes.
 * @author Samchon
 */
export const autoMovieBoundaryShellTriangles = (
  face: IAutoMovieBoundaryFace,
): IAutoMovieDrawingTriangle[] => {
  // Counter-clockwise so the far cap, the near cap and the sides all end up
  // wound outward, which is what makes the silhouette test read facing rather
  // than authoring order.
  const outline =
    polygonDoubleArea(face.outline) < 0
      ? [...face.outline].reverse()
      : face.outline;
  const near = outline.map((point) =>
    autoMovieBoundaryFacePoint(face, point, 0),
  );
  const far = outline.map((point) =>
    autoMovieBoundaryFacePoint(face, point, face.thickness),
  );
  const triangles: IAutoMovieDrawingTriangle[] = [];
  for (let index = 0; index < outline.length; ++index) {
    const next = (index + 1) % outline.length;
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
