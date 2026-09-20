/**
 * Whether a number is the design's own arithmetic or an approximation of it.
 *
 * This is the field that decides whether a quantity can be believed. A convex
 * polygon's area is exact; the volume of a space assembled from overlapping
 * convex cells is not, and a report that printed both as plain numbers would be
 * worse than one that printed neither.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieQuantityBasis` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieQuantityBasis` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export type AutoMovieQuantityBasis = "exact" | "approximate";
