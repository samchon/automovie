/**
 * The native normal-map slope scale line, after which per-vertex relief applies.
 * Detail blends remain downstream of this boundary and retain their own scale.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Names the base normal scale boundary used by declared relief weights.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps per-vertex relief modulation ahead of independent detail normal blending.
 */
export const RELIEF_WEIGHT_TARGET = "mapN.xy *= normalScale;";
