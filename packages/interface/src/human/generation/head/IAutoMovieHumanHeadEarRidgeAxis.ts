import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieHumanHeadEarRidge } from "./IAutoMovieHumanHeadEarRidge";

/** Type contracts exchanged by AutoMovieHumanHeadEarRidgeAxis; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadEarRidgeAxis {
  /** Result of AutoMovieHumanHeadEarRidgeAxis.of. Keep course points while a borrowed fork owns its entire initial plane.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Keep course points while a borrowed fork owns its entire initial plane.
   * @evidence contracts/development/design.md#principled-representation `axis`: Continuous ridge axis in calibration millimetres, evaluated in the original ear frame. `coordinates`: Ridge-owned mapping from its axis stations to the auricular source coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadEarRidgeAxis.IOfResult is the canonical exchange used by AutoMovieHumanHeadEarRidgeAxis.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `axis`, `coordinates`; callers supply the complete record.
   */
  export type IOfResult = {
    /** Continuous ridge axis in calibration millimetres, evaluated in the original ear frame. */
    axis: IAutoMovieViewAxis.IAxis;
    /** Ridge-owned mapping from its axis stations to the auricular source coordinates. */
    coordinates: IAutoMovieHumanHeadEarRidge.IRidge["coordinates"];
  };
}
