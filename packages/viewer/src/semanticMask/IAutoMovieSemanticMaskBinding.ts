import type {
  IAutoMovieScene,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

/**
 * A built scene and the palette its structural mask pass must paint it with.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs the exact designed scene ordering with its production-derived semantic palette for one built-scene structural pass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One borrowed binding keeps design and palette together at the scene userData handoff instead of widening every intermediate draw signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type cannot certify matching compiled artifact, object ordering, id admission or drawn pixels merely from field presence; producers and the scene mapper own those premises.
 * @evidence contracts/development/common.md#meaningful-documentation Fields identify design declaration order and same-production palette, with explicit borrowed binding responsibility.
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
