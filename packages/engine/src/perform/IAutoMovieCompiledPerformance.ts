import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";

/**
 * compilePerformance's actor-keyed clips and every channel removed by body-region masks. Actors without a returned clip have no entry; mask reports retain the original action index and actor.
 *
 * @evidence contracts/development/design.md#principled-representation A string-keyed record matches downstream per-node motion lookup, and a separate ordered report prevents discarded authored content from being confused with successfully applied content.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps timeline output and loss diagnostics in one return value without a status wrapper or extra synthesis pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty masked means no region loss, not universal ROM or physical validity; those gates remain downstream.
 * @evidence contracts/development/common.md#meaningful-documentation Documents exact actor keys, null-synthesis absence, original action indices and report ordering.
 */
export interface IAutoMovieCompiledPerformance {
  /** Per-actor performance motion, keyed by actor node id. */
  performances: Record<string, IAutoMovieMotion>;

  /**
   * Every action/actor's content removed by its region mask. Traversal follows
   * first-encounter actor and region order, then placement start and action
   * index within that region; it is not globally action-index sorted.
   */
  masked: IAutoMovieMaskedContent[];
}
