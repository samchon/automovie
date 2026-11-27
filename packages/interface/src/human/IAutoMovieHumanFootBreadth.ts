import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Independent regional across extrema, including the exact source point owning
 * each support. Runtime construction and admission remain with
 * AutoMovieHumanFootBreadth in Human.
 */
export namespace IAutoMovieHumanFootBreadth {
  /**
   * The actual source point owning one observed across support, calibration mm.
   *
   * The synchronous caller owns this finite record.
   */
  export interface IReading {
    /** Actual anatomical source name. */

    part: string;

    /** Signed chart side. */

    quarter: 1 | 3;

    /** Material station, calibration mm. */

    station: number;

    /** Original world source point, calibration mm. */

    point: AutoMovieVector3Tuple;

    /** Heel-relative foot-along projection, calibration mm. */

    along: number;

    /** Heel-relative anatomical lateral projection, calibration mm. */

    across: number;
  }

  /**
   * Independent across extrema of the declared anatomical group region.
   *
   * The caller owns both finite readings.
   */
  export interface ISupport {
    /** Lowest anatomical across projection in the region. */

    minimum: IReading;

    /** Highest anatomical across projection in the region. */

    maximum: IReading;

    /** Maximum minus minimum, in the source's calibration-mm across units. */

    breadth: number;
  }
}
