import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";

/** Data and callback contracts shared by the ViewAxisJet operations. */
export namespace IAutoMovieViewAxisJet {
  /**
   * Frame value and first two component derivatives in one coordinate. Physical
   * station in millimetres is the default. An explicitly selected root or angle
   * map changes only the derivative coordinate.
   */
  export interface IJet {
    /** Frame value with world-millimetre origin and dimensionless chart axes. */
    value: IAutoMovieLoftSectionFrame;

    /**
     * First derivative of the origin and each axis component with respect to
     * the same coordinate. The station form uses mm/mm for origin and 1/mm for
     * axes.
     */
    first: IAutoMovieLoftSectionFrame;

    /**
     * Second derivative of the origin and axes with respect to the same
     * coordinate. The station form uses 1/mm for origin and 1/mm² for axes.
     */
    second: IAutoMovieLoftSectionFrame;
  }
}
