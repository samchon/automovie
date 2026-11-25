/**
 * Foot-fan knot coordinates and retained guide splines, including first and
 * second derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanFootGuide in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootGuide {
  /** A guide: its kept knots' stations and places, and their spline's jets. */
  export interface IGuide {
    /** Strictly increasing stations of the kept knots. */
    stations: number[];

    /** Each kept knot's `[across, up]` in its plane, mm. */
    values: number[][];

    /** The spline's first derivatives at the knots. */
    slopes: number[][];

    /** The spline's second derivatives at the knots. */
    curvatures: number[][];
  }

  /**
   * A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's
   * station as a share of the web ring to the ankle ring, and the landmark's
   * place with its height both in foot lengths and in lateral malleolus heights
   * (handed from the first to the second over the turn).
   */
  export type IFanKnot = readonly [number, number, number, number, number];
}
