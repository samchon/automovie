import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";

/** Type contracts exchanged by AutoMovieHumanTrunkConstruction; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkConstruction {
  /** One actual solve and its placement metadata, before legacy chains are requested.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One actual solve and its placement metadata, before legacy chains are requested.
   * @evidence contracts/development/design.md#principled-representation `solution`: Same solved trunk used by placement and the current body original builders. `calibration`: Existing neck, landmarks and diagnostics; no legacy trunk chains are added.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkConstruction.prepare. Read by AutoMovieHumanTrunkConstruction.loft.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `solution`, `calibration`; callers supply the complete record.
   */
  export interface IPlacement {
    /** Same solved trunk used by placement and the current body original builders. */
    solution: IAutoMovieHumanTrunkSolution;
    /** Existing neck, landmarks and diagnostics; no legacy trunk chains are added. */
    calibration: IAutoMovieHumanBodyCalibration;
  }

  /** The original argument of AutoMovieHumanTrunkConstruction.prepare. Prepare the same solve and metadata without constructing legacy chains.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Prepare the same solve and metadata without constructing legacy chains.
   * @evidence contracts/development/design.md#principled-representation `seat`: Previously prepared neck seat shared with the trunk's upper support. `raw`: Explicitly request the original neck chain; no geometry is requested until this callback is called.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkConstruction.IPrepareOriginal is the canonical exchange used by AutoMovieHumanTrunkConstruction.prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `seat`, `raw`; callers supply the complete record.
   */
  export type IPrepareOriginal = {
    /** Previously prepared neck seat shared with the trunk's upper support. */
    seat: IAutoMovieHumanTrunkNeckSeat.ISeat;
    /** Explicitly request the original neck chain; no geometry is requested until this callback is called. */
    raw: () => IAutoMovieLoftChain;
  };
}
