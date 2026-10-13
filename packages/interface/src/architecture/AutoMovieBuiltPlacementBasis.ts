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
 * The engine assigns `element-origin-point` whenever an element's resolved box
 * has equal minimum and maximum on every axis, so a model whose drawn vertices
 * all coincide carries that label too.
 *
 * @evidence contracts/common.md#principled-implementation Four literals record which measurement produced a box; `builtEnvironmentPlacementBounds` picks geometry or origin-point for an element by testing whether its box collapses to one point, population bounds for an instance set, and the support resolver uses the height rule for a named surface.
 * @evidence contracts/common.md#clear-and-simple-design One basis union is shared by bounds, overlap, support and floating-body results, and the body-only results narrow it with `Exclude` where the surface rule cannot occur.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The origin-point label is inferred from a zero-extent box rather than from why no vertices exist, so a degenerate model is reported as an unmeasured reference; that inference is the one compensation and the prose states it.
 * @evidence contracts/common.md#meaningful-documentation Explains what each basis measured, that population bounds are a conservative envelope, that an origin-point box is a point, and how the engine decides that label.
 * @author Samchon
 */
export type AutoMovieBuiltPlacementBasis =
  | "element-geometry-bounds"
  | "element-origin-point"
  | "population-placement-bounds"
  | "surface-height-rule";
