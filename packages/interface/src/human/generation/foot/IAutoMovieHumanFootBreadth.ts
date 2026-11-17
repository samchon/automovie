import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanFootBreadth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootBreadth {
  /**
   * The actual source point owning one observed across support, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Retains the source name, material station and world point beside its anatomical projection.
   * @evidence contracts/common.md#clear-and-simple-design A single reading identifies the support owner without retaining an entire curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The point is read from the source axis and scalar owner, not a sampled loft.
   * @evidence contracts/common.md#meaningful-documentation Members distinguish world point, material station and foot-axis projections.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A reading record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measure operation owns source preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous caller owns this finite record.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual source point owning one observed across support, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `part`: Actual anatomical source name. `quarter`: Signed chart side. `station`: Material station, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanFootBreadth.minimum, AutoMovieHumanFootBreadth.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `quarter`, `station`, `point`, `along`, `across`; callers supply the complete record.
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
   * @evidence contracts/common.md#principled-implementation The minimum and maximum may belong to different parts or sections, matching across support-plane breadth.
   * @evidence contracts/common.md#clear-and-simple-design Two owner readings and their difference expose the dimension used by the caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not call one ball cut or the bare host the whole group's breadth.
   * @evidence contracts/common.md#meaningful-documentation States the regional union and numerical original-source scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The result type performs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measure operation owns reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns both finite readings.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Independent across extrema of the declared anatomical group region.
   * @evidence contracts/development/design.md#principled-representation `minimum`: Lowest anatomical across projection in the region. `maximum`: Highest anatomical across projection in the region. `breadth`: Maximum minus minimum, in the source's calibration-mm across units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootBreadth.measure. Also types AutoMovieHumanFootInterim.raw.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `minimum`, `maximum`, `breadth`; callers supply the complete record.
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
