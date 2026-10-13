import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/** A named opening or closing state required by a shot. */
export interface IAutoMovieNamedState {
  /** Stable state id. */
  id: string;

  /** Non-blank human-readable state contract; it is never proof by itself. */
  description: string;

  /**
   * Machine-checkable facts sampled from compiled pose and transform output.
   *
   * Descriptive prose never discharges a state contract by itself.
   */
  predicates: IAutoMovieShotPredicate[];
}
