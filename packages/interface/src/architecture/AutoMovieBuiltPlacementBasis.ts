/**
 * How a resolved placement quantity was measured.
 *
 * The basis describes the measurement path. `element-geometry-bounds` folds static CPU stated/tessellated vertices under current element and part transforms; it excludes skinning, attached-bone transforms, other animation, external asset geometry and GPU Float32 effects. `population-placement-bounds` is a compact placement envelope that can include gaps between members. `surface-height-rule` reads an authored height function at retained probes, not the entire surface. `element-origin-point` is a zero-extent box from an unavailable/vertexless model or genuine coincident geometry, so it describes a point rather than occupied volume.
 *
 * The engine assigns `element-origin-point` whenever an element's resolved box
 * has equal minimum and maximum on every axis, so a model whose drawn vertices
 * all coincide carries that label too.
 *
 * @evidence contracts/common.md#principled-implementation `builtEnvironmentPlacementBounds` labels an element box by comparing its minimum and maximum on all three axes and labels every population box from `builtInstanceSetPlacementBounds`; `builtEnvironmentSupportStatus` labels a surface support `surface-height-rule`.
 * @evidence contracts/common.md#clear-and-simple-design Four closed literals, one per resolution path, carried beside the box so overlap and support results report their own measurement quality without a second lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A body without vertices is reported as a point with its own label instead of being given an invented extent, and the degenerate-box rule that also labels coincident drawn vertices is stated rather than hidden.
 * @evidence contracts/common.md#meaningful-documentation States what each basis measured, what a point basis means for overlaps and gaps, and the exact rule that assigns `element-origin-point`.
 */
export type AutoMovieBuiltPlacementBasis =
  | "element-geometry-bounds"
  | "element-origin-point"
  | "population-placement-bounds"
  | "surface-height-rule";
