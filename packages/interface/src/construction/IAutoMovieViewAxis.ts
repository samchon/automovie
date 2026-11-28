import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieConstructionParallelAxis } from "./IAutoMovieConstructionParallelAxis";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewAxisJet } from "./IAutoMovieViewAxisJet";

/** Data and callback contracts shared by the ViewAxis operations. */
export namespace IAutoMovieViewAxis {
  /**
   * Read a section plane along a part's station axis. Values use a
   * world-millimetre origin and orthonormal dimensionless chart axes. Analytic
   * owners can also expose the two frame derivatives in station or in a
   * selected root or angle coordinate.
   */
  export interface IAxis {
    /**
     * Read the section plane at physical station in millimetres. The frame
     * contains a world-millimetre origin and unit u and v axes.
     *
     * @param station Physical station in millimetres.
     * @returns World-millimetre origin and dimensionless chart axes.
     */
    at(station: number): IAutoMovieLoftSectionFrame;

    /**
     * Read the frame and its first two derivatives at the given millimetre
     * station. Omit parameter for station derivatives. A kernel-millimetre root
     * or angle map selects a different derivative coordinate; the owner can
     * return null when the requested derivatives are unavailable.
     */
    jet?(
      station: number,
      parameter?: IAutoMovieConstructionOutlineParameter,
    ): IAutoMovieViewAxisJet.IJet | null;

    /**
     * Original authored metre declaration of a parallel axis, when supplied by
     * the parallel-axis factory.
     */
    readonly parallel?: IAutoMovieConstructionParallelAxis;
  }

  /**
   * Authored kernel point of a curved axis, with a strictly increasing station
   * and its world position in millimetres.
   */
  export interface IAxisKnot {
    /** Physical station in millimetres, increasing over the axis knots. */
    station: number;

    /** World [x, y, z] axis position in millimetres at this knot. */
    point: AutoMovieVector3Tuple;
  }

  /**
   * Source knot of a level-axis horizontal offset. Station is world height in
   * millimetres, and the value is the corresponding horizontal coordinate in
   * millimetres.
   */
  export interface IAxisKnot1 {
    /** World height in millimetres, increasing across this offset's knots. */
    station: number;

    /** World X or Z in millimetres as specified by the containing offset curve. */
    value: number;
  }

  /**
   * Straight portion of one jointed centreline segment. All distances are in
   * millimetres. Convert segment offset x within [from, to] to course station
   * as start + x − from. Neighbouring turns use the remaining segment
   * distance.
   */
  export interface IRun {
    /**
     * Distance along the source segment to the straight run's first point. The
     * previous turn supplies the setback; the first run starts at zero.
     */
    from: number;

    /**
     * Distance along the source segment to the straight run's last point, after
     * reserving the next turn's setback.
     */
    to: number;

    /** Course station in millimetres at segment offset from. */
    start: number;

    /** Course station in millimetres at segment offset to. */
    end: number;
  }
}
