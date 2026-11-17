import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionSource } from "../../../construction/IAutoMovieLoftSectionSource";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Native neck boundary fields and physical-station frame derivatives before coefficient construction. Runtime construction and admission remain with AutoMovieHumanTrunkConnection in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes native neck boundary fields and physical-station frame derivatives before coefficient construction; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Native neck boundary fields and physical-station frame derivatives before coefficient construction. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkConnection; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkConnection contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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
    frame: IAutoMovieLoftSectionFrame;

    /** Actual first derivative in physical station millimetres. */
    frameSlopes: IAutoMovieLoftSectionFrame;

    /** Actual second derivative in the same physical station. */
    frameCurvatures: IAutoMovieLoftSectionFrame;
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
