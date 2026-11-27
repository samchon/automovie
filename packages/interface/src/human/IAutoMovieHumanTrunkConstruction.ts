import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkConstruction; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanTrunkConstruction {
  /**
   * One actual solve and its placement metadata, before legacy chains are
   * requested.
   */
  export interface IPlacement {
    /**
     * Same solved trunk used by placement and the current body original
     * builders.
     */
    solution: IAutoMovieHumanTrunkSolution;
    /**
     * Existing neck, landmarks and diagnostics; no legacy trunk chains are
     * added.
     */
    calibration: IAutoMovieHumanBodyCalibration;
  }

  /**
   * The original argument of AutoMovieHumanTrunkConstruction.prepare. Prepare
   * the same solve and metadata without constructing legacy chains.
   */
  export type IPrepareOriginal = {
    /** Previously prepared neck seat shared with the trunk's upper support. */
    seat: IAutoMovieHumanTrunkNeckSeat.ISeat;
    /**
     * Explicitly request the original neck chain; no geometry is requested
     * until this callback is called.
     */
    raw: () => IAutoMovieLoftChain;
  };
}
