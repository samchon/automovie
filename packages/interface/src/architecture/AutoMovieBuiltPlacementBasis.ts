/**
 * How a resolved placement quantity was measured.
 *
 * The basis describes the measurement path. `element-geometry-bounds` folds
 * static CPU stated/tessellated vertices under current element and part
 * transforms; it excludes skinning, attached-bone transforms, other animation,
 * external asset geometry and GPU Float32 effects.
 * `population-placement-bounds` is a compact placement envelope that can
 * include gaps between members. `surface-height-rule` reads an authored height
 * function at retained probes, not the entire surface. `element-origin-point`
 * is a zero-extent box from an unavailable/vertexless model or genuine
 * coincident geometry, so it describes a point rather than occupied volume.
 *
 * The engine assigns `element-origin-point` whenever an element's resolved box
 * has equal minimum and maximum on every axis, so a model whose drawn vertices
 * all coincide carries that label too.
 */
export type AutoMovieBuiltPlacementBasis =
  | "element-geometry-bounds"
  | "element-origin-point"
  | "population-placement-bounds"
  | "surface-height-rule";
