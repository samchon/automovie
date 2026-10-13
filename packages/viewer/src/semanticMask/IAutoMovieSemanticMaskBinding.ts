import type { IAutoMovieScene, IAutoMovieSemanticMask } from "@automovie/interface";

/**
 * A built scene and the palette its structural mask pass must paint it with.
 *
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
