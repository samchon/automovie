import { AutoMovieDrawingProjection } from "@automovie/interface";

/*
 * Whether a projection cuts: removes the material on the viewer's side of its
 * plane and drafts what the plane passes through.
 *
 * Every projection except `elevation` cuts, so a plan, a reflected ceiling plan
 * and a section all draw cut linework and room regions, while an elevation only
 * projects. A new projection added to the closed union is a cutting one unless
 * this rule is changed with it.
 * Parameter projection: The view's projection.
 * Returns: `true` for every projection other than `elevation`.
 */
export const drawingHasCut = (
  projection: AutoMovieDrawingProjection,
): boolean => projection !== "elevation";
