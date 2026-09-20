/**
 * Name of the viewer object drawing one fluid domain's free surface.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Gives a generated water surface a stable mask identity even though no scene node owns it.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Joins the structural pass entry to the viewer object that draws the domain surface.
 */
export const autoMovieFluidSurfaceNodeName = (domain: string): string =>
  `water:${domain}`;
