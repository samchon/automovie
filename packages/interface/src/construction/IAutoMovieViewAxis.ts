import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewAxisJet } from "./IAutoMovieViewAxisJet";

/**
 * Data and callback contracts shared by the ViewAxis operations.
 *
 * @evidence contracts/development/design.md#principled-representation The axis capability evaluates world-mm section frames at station mm, with optional analytic jets; knots and straight-run records keep the same physical coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewAxis and its course/parallel-axis producers share these contracts with loft frame and source readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent jet remains value-only; finite knots and orthonormal frame premises belong to the corresponding engine producer.
 * @evidence contracts/development/common.md#meaningful-documentation Documents source station, frame ownership, optional derivatives and straight-run placement.
 */
export namespace IAutoMovieViewAxis {
  /**
   * A source section plane with optional analytic station derivatives.
   *
   * @evidence contracts/development/design.md#principled-representation at reads the actual source plane; jet, when supplied, differentiates that same source instead of a resampled frame spline.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Value-only axes remain supported and analytic owners add one explicitly optional callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing analytic derivatives remain absent; a numerical minimal-rotation frame does not acquire an exact jet guarantee.
   * @evidence contracts/development/common.md#meaningful-documentation Callers must keep source data immutable; jet may return null at a singular or unrepresentable station.
   */
  export interface IAxis {
    /**
     * The section plane at a station.
     *
     * @param station Station along the part, mm.
     * @returns Origin on the axis and orthonormal chart axes, world mm.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States source-plane output and kernel station units.
     */
    at(station: number): IAutoMovieLoftSectionFrame;

    /**
     * Analytic value and two derivatives in station or the explicitly selected coordinate, whose endpoints use kernel mm; null at a singular/nonfinite query, absent on numerical frame-value owners.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States absence, singularity and derivative-coordinate meaning.
     */
    jet?(
      station: number,
      parameter?: IAutoMovieConstructionOutlineParameter,
    ): IAutoMovieViewAxisJet.IJet | null;
  }

  /**
   * One source point of a curved axis in world mm.
   *
   * @evidence contracts/development/design.md#principled-representation A station/point pair defines an original natural-curve datum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One scalar and one triple carry each knot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No frame derivative is inferred by the record itself.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units and increasing station order.
   */
  export interface IAxisKnot {
    /** Station, mm, strictly increasing over the knots. */
    station: number;

    /** The axis point there, world mm. */
    point: AutoMovieVector3Tuple;
  }

  /**
   * One mm-valued source offset at a mm station.
   *
   * @evidence contracts/development/design.md#principled-representation A scalar knot specifies one original level-course offset.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two numbers carry the scalar source datum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record neither validates station order nor invents derivative data.
   * @evidence contracts/development/common.md#meaningful-documentation Both members state kernel mm units.
   */
  export interface IAxisKnot1 {
    /** Station, mm, strictly increasing over the knots. */
    station: number;

    /** The value there, mm. */
    value: number;
  }

  /**
   * One segment's straight run on a jointed axis: where along the segment the course runs on its line, and the stations there. Outside the run the course is in a turn and cuts the corner inside the segment's line.
   *
   * @evidence contracts/development/design.md#principled-representation A point at a distance along a segment's straight run stands at the run's start station plus that distance past the run's start, because the course is the segment's own line there and its station is arclength.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four numbers: the run's two ends as distances from the segment's first centre and as stations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A point inside a turn has no station on the segment's line; the run says where that begins rather than guessing one.
   * @evidence contracts/development/common.md#meaningful-documentation States each field, its unit and what lies outside the run.
   */
  export interface IRun {
    /** Distance from the segment's first centre where the run starts, mm: the previous turn's set-back, 0 on the first segment. */
    from: number;

    /** Distance from the segment's first centre where the run ends, mm: the segment's length less the next turn's set-back. */
    to: number;

    /** The station at `from`, mm. */
    start: number;

    /** The station at `to`, mm. */
    end: number;
  }
}
