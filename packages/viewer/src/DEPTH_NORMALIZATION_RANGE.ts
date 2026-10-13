

/**
 * Metric range (meters) the depth pass normalizes onto (#1167). Depth grays are
 * LINEAR in camera-space distance over `[0, range]` (white at the lens, black
 * at `range` and beyond) and deliberately decoupled from the camera's near/far
 * clip planes, so the same world depth maps to the same gray across shots,
 * cuts, and chunks (per-camera clip planes vary; this range does not).
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
 */
export const DEPTH_NORMALIZATION_RANGE = 20;
