import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";

/**
 * Data and callback contracts shared by the ViewAxisJet operations.
 *
 * @evidence contracts/development/design.md#principled-representation IJet separates frame value from first/second component derivatives in the selected coordinate, station mm by default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewAxisJet shares LoftFrame's component layout with analytic axis producers and loft source bindings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Derivative axes are not normalized directions; finite value and available derivative orders require source admission.
 * @evidence contracts/development/common.md#meaningful-documentation Gives origin/axis units and derivative-coordinate interpretation.
 */
export namespace IAutoMovieViewAxisJet {
  /**
   * One origin/u/v value and its first two derivatives in the query's selected coordinate, millimetre station by default.
   *
   * @evidence contracts/development/design.md#principled-representation Three frame-shaped records distinguish the source value from first and second derivatives in the query coordinate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The frame component layout is shared with existing loft endpoint jets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derivative vectors are not normalized and this record certifies no numerical accuracy by itself.
   * @evidence contracts/development/common.md#meaningful-documentation Origin has mm units and axes are dimensionless; derivatives divide by the selected coordinate's units (mm of station by default).
   */
  export interface IJet {
    /** Actual source frame, with origin in world mm and dimensionless axes. */
    value: IAutoMovieLoftSectionFrame;

    /** First derivative of each component in the selected coordinate, per mm by default. */
    first: IAutoMovieLoftSectionFrame;

    /** Second derivative of each component in the selected coordinate, per squared mm by default. */
    second: IAutoMovieLoftSectionFrame;
  }
}
