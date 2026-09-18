/**
 * Name of the viewer group drawing one planting cluster's batches.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Gives both branch and leaf batches one stable cluster identity in the mask channel.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Joins the structural pass entry to the viewer group that draws a planting cluster.
 */
export const autoMoviePlantingNodeName = (cluster: string): string =>
  `planting:${cluster}`;
