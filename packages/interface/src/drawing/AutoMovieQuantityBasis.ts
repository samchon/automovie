/**
 * Whether a number is the design's own arithmetic or an approximation of it.
 *
 * This is the field that decides whether a quantity can be believed. A convex
 * polygon's area is exact; the volume of a space assembled from overlapping
 * convex cells is not, and a report that printed both as plain numbers would
 * hide which one a reader may order against.
 *
 * `measureAutoMovieQuantities` decides the basis per subject, not per design:
 * `space-volume` is always `approximate`, with the cell-union explanation
 * attached, and every other subject is `exact`, even when every space is a
 * closed shell whose volume is measured exactly.
 *
 * @evidence contracts/common.md#principled-implementation The basis follows the method: shoelace areas, closed-form void areas, polyline lengths and counts are exact arithmetic over authored geometry, while a cell-stated volume sums convex cells whose overlaps are counted once each, so the finding that may include it is marked approximate.
 * @evidence contracts/common.md#clear-and-simple-design A finding totals one subject over many owners, so the basis is a per-finding label and the reason travels on the finding's `approximation` text rather than on each contributor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The volume finding is labelled approximate for every design, including all-shell ones, rather than switching labels on what a particular design happens to contain; the over-conservative label for all-shell designs is a stated limitation.
 * @evidence contracts/common.md#meaningful-documentation States what each literal promises, which subject is approximate and why, and that the decision is per subject with the all-shell exception spelled out.
 * @author Samchon
 */
export type AutoMovieQuantityBasis = "exact" | "approximate";
