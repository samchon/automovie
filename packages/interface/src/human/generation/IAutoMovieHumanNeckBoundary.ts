import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanTrunkConnection } from "./trunk/IAutoMovieHumanTrunkConnection";

/**
 * Type contracts exchanged by AutoMovieHumanNeckBoundary; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanNeckBoundary exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IOutput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanNeckBoundary; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IOutput contracts and adds no alternate implementation, optional mode or runtime state.
 */
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
