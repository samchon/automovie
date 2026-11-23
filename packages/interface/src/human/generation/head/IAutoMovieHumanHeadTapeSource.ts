import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieCurveLengthMeasurement64 } from "../../../geometry/curve/IAutoMovieCurveLengthMeasurement64";

/**
 * Type contracts exchanged by AutoMovieHumanHeadTapeSource; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadTapeSource {
  /** Specified sagittally inclined plane and actual anterior/posterior anchors. */
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
   * Every course borrows this admitted source. The caller owns the part and
   * prepared scalar dependencies.
   */
  export interface IReader {
    /** Identical original mass, calibration mm. */
    part: IAutoMovieViewPart;
    /** Its admitted signed scalar and fullness owners. */
    source: IAutoMovieLoftViewSource.ISource;
  }

  /** Actual world point and derivative per radian of its source polar phase. */
  export interface IReading {
    /** Actual physical source station, mm. */
    station: number;
    /** Original world point, mm. */
    point: AutoMovieVector3Tuple;
    /** Total world derivative along the plane course, mm per radian. */
    derivative: AutoMovieVector3Tuple;
  }

  /**
   * Result of AutoMovieHumanHeadTapeSource.measure. Integrate the actual source
   * spans with the shared engine rule.
   */
  export type MeasureResult = IAutoMovieCurveLengthMeasurement64;
}
