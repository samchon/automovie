import type { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";

/** Live spine transport and station inputs for section-plane orientation. */
export namespace IAutoMovieOrientSweep {
  /**
   * Live spine transport and normalized station layout for reusable
   * section-plane orientation.
   *
   * Update first accounts for the requested carried basis. Queries apply
   * normalized linear quaternion interpolation with a sign choice across
   * station turns, held beyond the first and last station.
   */
  export type IProps = {
    /**
     * Borrowed frame-bearing transport retained by the orientation. Update it
     * before refreshing station turns.
     */
    transport: IAutoMovieSweepTransport;

    /**
     * Borrowed nonempty finite increasing normalized station buffer. Its length
     * fixes rotation storage at construction. Preserve station order.
     */
    knots: Float64Array;

    /**
     * True carries the initial transport axes at every spine point. False uses
     * the moving transported axes. Station turns apply in either case.
     */
    fixed: boolean;
  };
}
