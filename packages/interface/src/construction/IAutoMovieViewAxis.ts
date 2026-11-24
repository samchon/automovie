import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieConstructionParallelAxis } from "./IAutoMovieConstructionParallelAxis";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewAxisJet } from "./IAutoMovieViewAxisJet";

/** Data and callback contracts shared by the ViewAxis operations. */
export namespace IAutoMovieViewAxis {
  /** A source section plane with optional analytic station derivatives. */
  export interface IAxis {
    /**
     * The section plane at a station.
     *
     * @param station Station along the part, mm.
     * @returns Origin on the axis and orthonormal chart axes, world mm.
     */
    at(station: number): IAutoMovieLoftSectionFrame;

    /**
     * Analytic value and two derivatives in station or the explicitly selected
     * coordinate, whose endpoints use kernel mm; null at a singular/nonfinite
     * query, absent on numerical frame-value owners.
     */
    jet?(
      station: number,
      parameter?: IAutoMovieConstructionOutlineParameter,
    ): IAutoMovieViewAxisJet.IJet | null;

    /**
     * The original declaration of an axis prepared from one, carried by the
     * axis itself; absent on every other axis.
     */
    readonly parallel?: IAutoMovieConstructionParallelAxis;
  }

  /** One source point of a curved axis in world mm. */
  export interface IAxisKnot {
    /** Station, mm, strictly increasing over the knots. */
    station: number;

    /** The axis point there, world mm. */
    point: AutoMovieVector3Tuple;
  }

  /** One mm-valued source offset at a mm station. */
  export interface IAxisKnot1 {
    /** Station, mm, strictly increasing over the knots. */
    station: number;

    /** The value there, mm. */
    value: number;
  }

  /**
   * One segment's straight run on a jointed axis: where along the segment the
   * course runs on its line, and the stations there. Outside the run the course
   * is in a turn and cuts the corner inside the segment's line.
   */
  export interface IRun {
    /**
     * Distance from the segment's first centre where the run starts, mm: the
     * previous turn's set-back, 0 on the first segment.
     */
    from: number;

    /**
     * Distance from the segment's first centre where the run ends, mm: the
     * segment's length less the next turn's set-back.
     */
    to: number;

    /** The station at `from`, mm. */
    start: number;

    /** The station at `to`, mm. */
    end: number;
  }
}
