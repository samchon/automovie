import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Independent regional across extrema, including the exact source point owning each support. Runtime construction and admission remain with AutoMovieHumanFootBreadth in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes independent regional across extrema, including the exact source point owning each support; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Independent regional across extrema, including the exact source point owning each support. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanFootBreadth; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing FootBreadth contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanFootBreadth {
  /**
   * The actual source point owning one observed across support, calibration mm.
   *
   * The synchronous caller owns this finite record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual source point owning one observed across support, calibration mm.
   * @evidence contracts/development/design.md#principled-representation Retains the source name, material station and world point beside its anatomical projection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A single reading identifies the support owner without retaining an entire curve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is read from the source axis and scalar owner, not a sampled loft.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Independent across extrema of the declared anatomical group region.
   * @evidence contracts/development/design.md#principled-representation The minimum and maximum may belong to different parts or sections, matching across support-plane breadth.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two owner readings and their difference expose the dimension used by the caller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not call one ball cut or the bare host the whole group's breadth.
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
