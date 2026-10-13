

/**
 * Name of the transient overlay group the pose pass adds to the scene.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Keeps this surface explicit about beauty versus structural output.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that distinction as a reversible render-product pass.
 */
export const POSE_OVERLAY_NAME = "__automovie_pose_overlay";
