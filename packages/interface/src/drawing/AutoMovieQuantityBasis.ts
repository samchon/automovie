/**
 * Whether a number is the design's own arithmetic or an approximation of it.
 *
 * This is the field that decides whether a quantity can be believed. A convex
 * polygon's area is exact; the volume of a space assembled from overlapping
 * convex cells is not, and a report that printed both as plain numbers would be
 * worse than one that printed neither.
 *
 * `measureAutoMovieQuantities` decides the basis per subject, not per design:
 * `space-volume` is always `approximate` and every other subject is `exact`,
 * even when every space is a closed shell whose volume is measured exactly.
 *
 * @author Samchon
 */
export type AutoMovieQuantityBasis = "exact" | "approximate";
