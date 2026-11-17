import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieCurveLengthMeasurement64 } from "../../../geometry/curve/IAutoMovieCurveLengthMeasurement64";

/** Type contracts exchanged by AutoMovieHumanHeadTapeSource; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadTapeSource {
  /**
   * Specified sagittally inclined plane and actual anterior/posterior anchors.
   *
   * @evidence contracts/common.md#principled-implementation Actual original phase0/pi points determine Y=a+bX.
   * @evidence contracts/common.md#clear-and-simple-design The plane stores physical source bounds and two scalar coefficients.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These are generating-source anchors, not camera coordinates or reference-fit points.
   * @evidence contracts/common.md#meaningful-documentation a is mm, b is dimensionless and range is increasing physical station mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Plane construction owns its two source queries.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fixed-size numeric data owns no external resources.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specified sagittally inclined plane and actual anterior/posterior anchors.
   * @evidence contracts/development/design.md#principled-representation `a`: Superior-axis intercept, mm. `b`: Front-higher sagittal slope, dimensionless. `front`: Actual phase0 anterior anchor, world mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTapeSource.plane. Read by AutoMovieHumanHeadTapeSource.at, AutoMovieHumanHeadTapeSource.course, AutoMovieHumanHeadTapeSource.measure. Also types AutoMovieHumanHeadTape.plane, AutoMovieHumanHeadTapeBrow.plane.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `a`, `b`, `front`, `back`, `range`; callers supply the complete record.
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
   * @evidence contracts/common.md#principled-implementation Keeps generating supports, fullness and actual frame owner together.
   * @evidence contracts/common.md#clear-and-simple-design Two references supply the original reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No retained principal section or mesh replaces the original definition.
   * @evidence contracts/common.md#meaningful-documentation Source station and world coordinates use calibration mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Every course borrows this admitted source.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the part and prepared scalar dependencies.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Same actual mass and admitted complete original scalar family.
   * @evidence contracts/development/design.md#principled-representation `part`: Identical original mass, calibration mm. `source`: Its admitted signed scalar and fullness owners.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTapeSource.of. Read by AutoMovieHumanHeadTape.maximum, AutoMovieHumanHeadTapeBrow.maximum, AutoMovieHumanHeadTapeSource.plane. Also types AutoMovieHumanHeadTape.reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `source`; callers supply the complete record.
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
   * @evidence contracts/common.md#principled-implementation The derivative differentiates the same implicit plane/source intersection as the point.
   * @evidence contracts/common.md#clear-and-simple-design Point, station and one tangent expose the course independently of integration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source/frame derivatives are never zero-filled.
   * @evidence contracts/common.md#meaningful-documentation Point/station use mm and derivative uses mm per radian.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work at owns original reads.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns owned fixed-size vectors.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual world point and derivative per radian of its source polar phase.
   * @evidence contracts/development/design.md#principled-representation `station`: Actual physical source station, mm. `point`: Original world point, mm. `derivative`: Total world derivative along the plane course, mm per radian.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTapeSource.at, AutoMovieHumanHeadTapeSource.course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `station`, `point`, `derivative`; callers supply the complete record.
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
