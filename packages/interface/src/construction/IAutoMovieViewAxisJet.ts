import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";

/** Data and callback contracts shared by the ViewAxisJet operations. */
export namespace IAutoMovieViewAxisJet {
  /**
   * One origin/u/v value and its first two derivatives in the query's selected
   * coordinate, millimetre station by default.
   */
  export interface IJet {
    /** Actual source frame, with origin in world mm and dimensionless axes. */
    value: IAutoMovieLoftSectionFrame;

    /**
     * First derivative of each component in the selected coordinate, per mm by
     * default.
     */
    first: IAutoMovieLoftSectionFrame;

    /**
     * Second derivative of each component in the selected coordinate, per
     * squared mm by default.
     */
    second: IAutoMovieLoftSectionFrame;
  }
}
