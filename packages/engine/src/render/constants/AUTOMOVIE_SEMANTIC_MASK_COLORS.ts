/**
 * Colours the mask may assign: the exact 8-bit RGB space minus `#000000`, which
 * is reserved for background.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Reserves black for background and exposes the exact non-background palette available to semantic identities.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Defines the bounded RGB channel space used by the structural identity-mask product.
 */
export const AUTOMOVIE_SEMANTIC_MASK_COLORS = 0xffffff;
