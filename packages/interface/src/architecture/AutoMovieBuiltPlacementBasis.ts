/**
 * How a resolved placement quantity was measured.
 *
 * A placement answer is only as good as the extent it was taken from, so the
 * basis travels with every result. `element-geometry-bounds` measured the same
 * vertices the renderer draws. `population-placement-bounds` is the
 * conservative envelope of a compact repeated field, never its expanded
 * members. `surface-height-rule` evaluated an authored support surface exactly.
 * `element-origin-point` measured no extent at all: the building record states
 * where the body stands but carries no vertices for it, as with a runtime model
 * reference, so the box is that single stated world origin and an overlap or
 * gap taken from it is a claim about a point rather than about a volume.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Keeps a query's visual-support basis visible instead of presenting it as structural engineering.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Distinguishes exact authored surface rules from element geometry, conservative compact-population bounds, and an extent-free stated origin.
 * @author Samchon
 */
export type AutoMovieBuiltPlacementBasis =
  | "element-geometry-bounds"
  | "element-origin-point"
  | "population-placement-bounds"
  | "surface-height-rule";
