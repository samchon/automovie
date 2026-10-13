/**
 * The scene-local key shared by palette attachment and lookup. Keeping it in
 * one owner makes both operations address the same binding without a second
 * map or lifetime outside the scene.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Identifies the scene's semantic palette for both attachment and rendering lookup.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Keeps the mask binding on the scene consumed by the structural pass.
 */
export const SCENE_MASK_KEY = "automovieSemanticMask";
