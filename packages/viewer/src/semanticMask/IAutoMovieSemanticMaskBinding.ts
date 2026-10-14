import type { IAutoMovieScene, IAutoMovieSemanticMask } from "@automovie/interface";

/**
 * A built scene and the palette its structural mask pass must paint it with.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the exact designed scene ordering with its production-derived semantic palette for one built-scene structural pass.
 * @evidence contracts/common.md#clear-and-simple-design One borrowed binding keeps design and palette together at the scene userData handoff instead of widening every intermediate draw signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type cannot certify matching compiled artifact, object ordering, id admission or drawn pixels merely from field presence; producers and the scene mapper own those premises.
 * @evidence contracts/common.md#meaningful-documentation Fields identify design declaration order and same-production palette, with explicit borrowed binding responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Two references represent this handoff; actual index construction, traversal and material work belongs to the mapper and palette producer.
 * @evidence contracts/performance.md#reuse-equivalent-work Multiple pass callers can borrow the same binding while it still describes the same live design/palette; a rebuilt or changed production must replace the binding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The interface owns no disposer or cache; the scene/caller retains these document references and controls scene retirement or binding replacement.
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
