import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieCurveLengthMeasurement64 } from "../../../geometry/curve/IAutoMovieCurveLengthMeasurement64";

/**
 * Type contracts exchanged by AutoMovieHumanHeadTapeSource; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanHeadTapeSource exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IPlane, IReader, IReading, MeasureResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanHeadTapeSource; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IPlane, IReader, IReading, MeasureResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanHeadTapeSource {
  /**
   * Specified sagittally inclined plane and actual anterior/posterior anchors.
   *
   * @evidence contracts/development/design.md#principled-representation Actual original phase0/pi points determine Y=a+bX. `a`: Superior-axis intercept, mm. `b`: Front-higher sagittal slope, dimensionless. `front`: Actual phase0 anterior anchor, world mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The plane stores physical source bounds and two scalar coefficients. Returned by AutoMovieHumanHeadTapeSource.plane. Read by AutoMovieHumanHeadTapeSource.at, AutoMovieHumanHeadTapeSource.course, AutoMovieHumanHeadTapeSource.measure. Also types AutoMovieHumanHeadTape.plane, AutoMovieHumanHeadTapeBrow.plane.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These are generating-source anchors, not camera coordinates or reference-fit points. Required fields are `a`, `b`, `front`, `back`, `range`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation a is mm, b is dimensionless and range is increasing physical station mm. Specified sagittally inclined plane and actual anterior/posterior anchors.
   */
  export interface IPlane {
    /** Superior-axis intercept, mm. */
    a: number;
    /** Front-higher sagittal slope, dimensionless. */
    b: number;
    /** Actual phase0 anterior anchor, world mm. */
    front: AutoMovieVector3Tuple;
    /** Actual phase-pi posterior anchor, world mm. */
    back: AutoMovieVector3Tuple;
    /** Physical source station bounds, increasing and closed. */
    range: [number, number];
  }

  /**
   * Same actual mass and admitted complete original scalar family.
   *
   * Every course borrows this admitted source.
   * The caller owns the part and prepared scalar dependencies.
   *
   * @evidence contracts/development/design.md#principled-representation Keeps generating supports, fullness and actual frame owner together. `part`: Identical original mass, calibration mm. `source`: Its admitted signed scalar and fullness owners.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two references supply the original reader. Returned by AutoMovieHumanHeadTapeSource.of. Read by AutoMovieHumanHeadTape.maximum, AutoMovieHumanHeadTapeBrow.maximum, AutoMovieHumanHeadTapeSource.plane. Also types AutoMovieHumanHeadTape.reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No retained principal section or mesh replaces the original definition. Required fields are `part`, `source`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation Source station and world coordinates use calibration mm. Same actual mass and admitted complete original scalar family.
   */
  export interface IReader {
    /** Identical original mass, calibration mm. */
    part: IAutoMovieViewPart;
    /** Its admitted signed scalar and fullness owners. */
    source: IAutoMovieLoftViewSource.ISource;
  }

  /**
   * Actual world point and derivative per radian of its source polar phase.
   *
   * @evidence contracts/development/design.md#principled-representation The derivative differentiates the same implicit plane/source intersection as the point. `station`: Actual physical source station, mm. `point`: Original world point, mm. `derivative`: Total world derivative along the plane course, mm per radian.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Point, station and one tangent expose the course independently of integration. Returned by AutoMovieHumanHeadTapeSource.at, AutoMovieHumanHeadTapeSource.course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing source/frame derivatives are never zero-filled. Required fields are `station`, `point`, `derivative`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation Point/station use mm and derivative uses mm per radian. Actual world point and derivative per radian of its source polar phase.
   */
  export interface IReading {
    /** Actual physical source station, mm. */
    station: number;
    /** Original world point, mm. */
    point: AutoMovieVector3Tuple;
    /** Total world derivative along the plane course, mm per radian. */
    derivative: AutoMovieVector3Tuple;
  }

  /** Result of AutoMovieHumanHeadTapeSource.measure. Integrate the actual source spans with the shared engine rule.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Integrate the actual source spans with the shared engine rule.
   * @evidence contracts/development/design.md#principled-representation Integrate the actual source spans with the shared engine rule. IAutoMovieCurveLengthMeasurement64 retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTapeSource.MeasureResult is the canonical exchange used by AutoMovieHumanHeadTapeSource.measure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeSource.measure for integrate the actual source spans with the shared engine rule.
   */
  export type MeasureResult = IAutoMovieCurveLengthMeasurement64;
}
