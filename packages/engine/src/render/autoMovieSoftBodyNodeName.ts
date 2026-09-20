/**
 * Name of the viewer object drawing one soft-body panel.
 *
 * Mirrors `buildSoftBodyObject`. The engine cannot import the viewer and the
 * mask has to be derivable without a renderer, so the names both sides agree on
 * live here and are asserted by the test suite, exactly as the standable
 * ground's group name is.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Gives a soft-body drawable one renderer-independent semantic-mask identity.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Joins the structural pass entry to the viewer object that paints the cloth panel.
 */
export const autoMovieSoftBodyNodeName = (domain: string): string =>
  `soft:${domain}`;
