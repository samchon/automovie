import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltOpening,
  type IAutoMovieDrawingDesignIndex,
  type IAutoMovieDrawingTriangle,
  IAutoMovieModel,
  type IAutoMovieOpeningNominalExtent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieDrawingElementTriangles } from "./autoMovieDrawingElementTriangles";
import { autoMovieOpeningExtent } from "./autoMovieOpeningExtent";
import { autoMovieOpeningFillExtent } from "./autoMovieOpeningFillExtent";

/*
 * The nominal width and height of one opening, and what they were measured
 * from, or `null` when nothing in the design sizes it.
 *
 * The opening's own void wins: it is the only record that describes the hole,
 * and its size is the hull the wall kernel cuts (`basis: "profile"`). Without
 * one, the filling element's world extent stands in (`basis: "fill"`), which is
 * the leaf and not the hole, so every caller labels it. An opening with
 * neither, or whose fill has no environment-owned model or no triangles, is
 * `null`. The drawing and the schedule both read this, so a sheet and a
 * schedule cannot size one opening two ways.
 * Parameter design: Index of the validated design that owns the opening.
 * Parameter opening: Opening to size.
 * Returns: The basis and the size in metres on the drawing grid, or `null`.
 */
export const autoMovieOpeningNominalExtent = (
  design: IAutoMovieDrawingDesignIndex,
  opening: IAutoMovieBuiltOpening,
): IAutoMovieOpeningNominalExtent.IResult => {
  if (opening.profile !== undefined)
    return { basis: "profile", ...autoMovieOpeningExtent(opening.profile) };
  const element: IAutoMovieBuiltElement | undefined =
    opening.fill === null ? undefined : design.elements.get(opening.fill);
  const model: IAutoMovieModel | undefined =
    element === undefined || element.model === null
      ? undefined
      : design.models.get(element.model);
  if (element === undefined || model === undefined) return null;
  const corners: IAutoMovieVector3[] = autoMovieDrawingElementTriangles(
    design,
    element,
    model,
  ).flatMap((triangle: IAutoMovieDrawingTriangle): IAutoMovieVector3[] => [
    triangle.a,
    triangle.b,
    triangle.c,
  ]);
  if (corners.length === 0) return null;
  return { basis: "fill", ...autoMovieOpeningFillExtent(corners) };
};
