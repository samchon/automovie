import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanLegAxis; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanLegAxis {
  /** A section plane, canonical, with its normal. */
  export interface IFrame {
    /** Origin, on the axis. */
    origin: AutoMovieVector3Tuple;

    /** In-plane axis, forward in the straight leg. */
    u: AutoMovieVector3Tuple;

    /** In-plane axis, lateral in the straight leg. */
    v: AutoMovieVector3Tuple;

    /** Normal, along the bone. */
    n: AutoMovieVector3Tuple;
  }

  /** The joints the axis passes through. */
  export interface IJoints {
    /** Hip centre. */
    hip: AutoMovieVector3Tuple;

    /** Knee centre. */
    knee: AutoMovieVector3Tuple;

    /** Ankle centre. */
    ankle: AutoMovieVector3Tuple;
  }

  /** One eased turn of the section normal about a fixed axis. */
  export interface ITurn {
    /** Station where the turn starts. */
    from: number;

    /** Length of the turn along the stations, mm. */
    span: number;

    /** Unit axis. */
    axis: AutoMovieVector3Tuple;

    /** Total angle, radians. */
    angle: number;
  }

  /** The leg's frames along its stations. */
  export interface IFrames {
    /** Station of the ankle ring. */
    s0: number;

    /** Station of the crotch ring. */
    s1: number;

    /**
     * The three turns: ankle ring to shank, shank to thigh, thigh to the crotch
     * ring.
     */
    turns: ITurn[];

    /** Residual twist about the vertical, radians. */
    twist: number;

    /** Knee centre. */
    knee: AutoMovieVector3Tuple;

    /** Origins at whole millimetres of station, from `s0 - PAD`. */
    origins: AutoMovieVector3Tuple[];
  }

  /**
   * The rate argument of AutoMovieHumanLegAxis.interpolated. A table's value at
   * s by cubic Hermite, with derivatives from `rate`.
   *
   * @param table Values at whole millimetres from `first`.
   * @param rate Derivative at a station.
   * @param first Station of the table's first value.
   * @param s Station read.
   */
  export type InterpolatedRate = (s: number) => AutoMovieVector3Tuple;
}
