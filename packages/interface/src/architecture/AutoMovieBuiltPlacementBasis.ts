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
 * @evidence contracts/common.md#principled-implementation `builtEnvironmentPlacementBounds` labels an element box by comparing its minimum and maximum on all three axes and labels every population box from `builtInstanceSetPlacementBounds`; `builtEnvironmentSupportStatus` labels a surface support `surface-height-rule`.
 * @evidence contracts/common.md#clear-and-simple-design Four closed literals, one per resolution path, carried beside the box so overlap and support results report their own measurement quality without a second lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A body without vertices is reported as a point with its own label instead of being given an invented extent, and the degenerate-box rule that also labels coincident drawn vertices is stated rather than hidden.
 * @evidence contracts/common.md#meaningful-documentation States what each basis measured, what a point basis means for overlaps and gaps, and the exact rule that assigns `element-origin-point`.
 * @author Samchon
 */
export type AutoMovieBuiltPlacementBasis =
  | "element-geometry-bounds"
  | "element-origin-point"
  | "population-placement-bounds"
  | "surface-height-rule";
