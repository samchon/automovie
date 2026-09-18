import { AutoMovieDrawingProjection } from "@automovie/interface";

/**
 * Whether a projection removes material and draws what the plane passes
 * through.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Decides whether a requested projection must expose material intersected by its view plane.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Classifies elevation as non-cutting and every plan or section projection as cutting.
 */
export const autoMovieDrawingHasCut = (
  projection: AutoMovieDrawingProjection,
): boolean => projection !== "elevation";
