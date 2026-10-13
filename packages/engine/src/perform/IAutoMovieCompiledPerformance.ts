import { IAutoMovieMotion } from "@automovie/interface";

import { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";

/**
 * What {@link compilePerformance} produced: the per-actor clips, and the
 * authored content its region masks discarded.
 *
 * @author Samchon
 */
export interface IAutoMovieCompiledPerformance {
  /** Per-actor performance motion, keyed by actor node id. */
  performances: Record<string, IAutoMovieMotion>;

  /**
   * Every piece of authored content a region mask dropped, ordered by action
   * index then actor. Empty when every clip fell inside its own region, which
   * is the ordinary case.
   */
  masked: IAutoMovieMaskedContent[];
}
