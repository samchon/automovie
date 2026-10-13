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
 * @evidence contracts/common.md#principled-implementation The approximation it flags is concrete: a space stated as convex cells is their union, and the report sums the cell volumes, which counts any overlap twice.
 * @evidence contracts/common.md#clear-and-simple-design Two literals paired with the finding's `approximation` sentence, which carries the reason so the basis itself stays a switch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis is hardcoded by subject name in `finish`, so a design whose spaces are all exactly measured shells still reports `space-volume` as approximate; a conservative constant rather than a per-design judgment, reported as a finding.
 * @evidence contracts/common.md#meaningful-documentation States why the field exists, that the basis is chosen per subject, and which subject is approximate even for exact input.
 * @author Samchon
 */
export type AutoMovieQuantityBasis = "exact" | "approximate";
