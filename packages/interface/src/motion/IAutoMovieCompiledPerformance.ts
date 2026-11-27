import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";

/**
 * CompilePerformance's actor-keyed clips and every channel removed by
 * body-region masks. Actors without a returned clip have no entry; mask reports
 * retain the original action index and actor.
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
