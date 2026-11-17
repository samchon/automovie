import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanTrunkConnection } from "./trunk/IAutoMovieHumanTrunkConnection";

/** Type contracts exchanged by AutoMovieHumanNeckBoundary; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeckBoundary {
  /** Same physical cut, complete native family and separate legacy support interpretation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Same physical cut, complete native family and separate legacy support interpretation.
   * @evidence contracts/development/design.md#principled-representation `connection`: Full original section and qualified physical frame2, calibration mm. `seat`: Existing internal-overlap support/finite-difference convention, not the qualified source jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeckBoundary.create. Also types AutoMovieHumanBodySources.boundary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `connection`, `seat`; callers supply the complete record.
   */
  export interface IOutput {
    /** Full original section and qualified physical frame2, calibration mm. */
    readonly connection: IAutoMovieHumanTrunkConnection.IDefinition;

    /** Existing internal-overlap support/finite-difference convention, not the qualified source jets. */
    readonly seat: IAutoMovieHumanTrunkNeckSeat.ISeat;
  }
}
