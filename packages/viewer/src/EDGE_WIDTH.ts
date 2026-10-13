

/**
 * Metric silhouette edge width (meters) of the outline pass (#1166): the
 * inverted-hull shell's normal offset. Metric (not a scale factor) so a thin
 * limb and a broad torso draw the same line weight.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
 */
export const EDGE_WIDTH = 0.02;
