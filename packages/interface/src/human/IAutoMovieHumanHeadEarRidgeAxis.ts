import type { IAutoMovieViewAxis } from "../construction/IAutoMovieViewAxis";
import type { IAutoMovieHumanHeadEarRidge } from "./IAutoMovieHumanHeadEarRidge";

/**
 * Type contracts exchanged by AutoMovieHumanHeadEarRidgeAxis; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanHeadEarRidgeAxis {
  /**
   * Result of AutoMovieHumanHeadEarRidgeAxis.of. Keep course points while a
   * borrowed fork owns its entire initial plane.
   */
  export type IOfResult = {
    /**
     * Continuous ridge axis in calibration millimetres, evaluated in the
     * original ear frame.
     */
    axis: IAutoMovieViewAxis.IAxis;
    /**
     * Ridge-owned mapping from its axis stations to the auricular source
     * coordinates.
     */
    coordinates: IAutoMovieHumanHeadEarRidge.IRidge["coordinates"];
  };
}
