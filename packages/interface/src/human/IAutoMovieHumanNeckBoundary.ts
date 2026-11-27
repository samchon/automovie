import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanTrunkConnection } from "./IAutoMovieHumanTrunkConnection";

/**
 * Type contracts exchanged by AutoMovieHumanNeckBoundary; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanNeckBoundary {
  /**
   * Same physical cut, complete native family and separate legacy support
   * interpretation.
   */
  export interface IOutput {
    /** Full original section and qualified physical frame2, calibration mm. */
    readonly connection: IAutoMovieHumanTrunkConnection.IDefinition;

    /**
     * Existing internal-overlap support/finite-difference convention, not the
     * qualified source jets.
     */
    readonly seat: IAutoMovieHumanTrunkNeckSeat.ISeat;
  }
}
