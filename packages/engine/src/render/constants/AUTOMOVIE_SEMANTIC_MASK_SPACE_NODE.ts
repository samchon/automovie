/**
 * Name of the viewer group holding a scene's standable ground.
 *
 * Mirrors `SPACE_GROUP_NAME` in the viewer. The engine cannot import the
 * viewer, and the mask has to be derivable without a renderer, so the one
 * constant both sides agree on is asserted by the test suite rather than shared
 * through a dependency that would invert the package layering.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Gives standable ground a stable node key shared by semantic derivation and rendering.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Joins the structural pass's space entry to the viewer group that actually paints it.
 */
export const AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE = "__automovie_space";
