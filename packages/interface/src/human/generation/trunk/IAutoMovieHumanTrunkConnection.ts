import type { IAutoMovieLoftFrame } from "../../../construction/IAutoMovieLoftFrame";
import type { IAutoMovieLoftSectionSource } from "../../../construction/IAutoMovieLoftSectionSource";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanTrunkConnection; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkConnection {
  /** One actual native generating boundary and frame2; this original view declares no additional phase lift.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One actual native generating boundary and frame2; this original view declares no additional phase lift.
   * @evidence contracts/development/design.md#principled-representation `boundary`: Actual regular neck boundary, before any coefficient layer exists. `field`: Whole phase family, not just four supports or fitted coefficients.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkConnection.normal. Read by AutoMovieHumanTrunkConnection.apply, AutoMovieHumanTrunkViews.of. Also types AutoMovieHumanNeckBoundary.inputs, AutoMovieHumanNeckBoundary.connection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `boundary`, `field`; callers supply the complete record.
   */
  export interface IDefinition {
    /** Actual regular neck boundary, before any coefficient layer exists. */
    boundary: IBoundary;

    /** Whole phase family, not just four supports or fitted coefficients. */
    field: Extract<
      IAutoMovieLoftSectionSource.IEndpoint["field"],
      {
        /** Discriminant selecting the native representation. */
        kind: "native";
      }
    >;
  }

  /** Actual original section plane and its available physical-station derivatives; no coefficient layer is manufactured.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual original section plane and its available physical-station derivatives; no coefficient layer is manufactured.
   * @evidence contracts/development/design.md#principled-representation `y`: Physical world-height station, calibration millimetres. `frame`: Original world origin and fixed +X/+Z basis. `frameSlopes`: Actual first derivative in physical station millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkConnection.IBoundary is the canonical exchange used by IAutoMovieHumanTrunkConnection.IDefinition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `y`, `frame`, `frameSlopes`, `frameCurvatures`; callers supply the complete record.
   */
  export interface IBoundary {
    /** Physical world-height station, calibration millimetres. */
    y: number;

    /** Original world origin and fixed +X/+Z basis. */
    frame: IAutoMovieLoftFrame.IFrame;

    /** Actual first derivative in physical station millimetres. */
    frameSlopes: IAutoMovieLoftFrame.IFrame;

    /** Actual second derivative in the same physical station. */
    frameCurvatures: IAutoMovieLoftFrame.IFrame;
  }

  /** A boundary read from an actual interval part additionally retains that part's original declarations.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A boundary read from an actual interval part additionally retains that part's original declarations.
   * @evidence contracts/development/design.md#principled-representation `original`: Actual preloft source ownership retained by both original consumers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkConnection.captureOriginal. Also types AutoMovieHumanTrunkConnection.inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `original`; callers supply the complete record.
   */
  export interface IConnection extends IDefinition {
    /** Actual preloft source ownership retained by both original consumers. */
    original: {
      /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
      part: IAutoMovieViewPart;
      /** Admitted original scalar/section owner for this geometric part; consumers read its declared source parameter. */
      source: IAutoMovieLoftViewSource.ISource;
    };
  }
}
