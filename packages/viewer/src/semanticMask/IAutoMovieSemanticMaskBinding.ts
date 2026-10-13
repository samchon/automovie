import type { IAutoMovieScene, IAutoMovieSemanticMask } from "@automovie/interface";

/**
 * A built scene and the palette its structural mask pass must paint it with.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Makes this public surface part of the stable identity-mask channel.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that channel as a structural render product.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskBinding {
  /**
   * The design the scene was built from, in its own declaration order.
   */
  design: IAutoMovieScene;

  /**
   * Palette derived from the same production.
   */
  mask: IAutoMovieSemanticMask;
}
