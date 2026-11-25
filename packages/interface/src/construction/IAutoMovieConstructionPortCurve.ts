import type { IAutoMovieConstructionPortField } from "./IAutoMovieConstructionPortField";

/** The existing radial port chart and angle/length clock correspondence. */
export namespace IAutoMovieConstructionPortCurve {
  /**
   * A port curve as one continuous owner of the shared boundary: its chart
   * point at every clock with two derivatives, the band's inward chart
   * direction with two derivatives, the clock of a chart point's radial foot
   * and the inside test, besides the columns' own addresses and directions
   * (`chart`).
   */
  export interface ICurve {
    /**
     * The columns' chart points, mm and radians:
     * `AutoMovieConstructionPortAddress` at each clock with its share.
     */
    addresses: [number, number][];

    /** The columns' inward chart directions, the ellipse's at each clock. */
    inward: [number, number][];

    /** Station bounds of the whole curve, mm. */
    reach: [number, number];

    /**
     * The ellipse's station semi-axis, mm: the largest station component of the
     * inward direction.
     */
    semi: number;

    /** The share field `r`. */
    share: IAutoMovieConstructionPortField.IField;

    /**
     * The curve's chart point at a clock with its first and second clock
     * derivatives.
     */
    at: (psi: number) => {
      point: [number, number];
      first: [number, number];
      second: [number, number];
    };

    /**
     * The band's inward chart direction at a clock, `(-a cos c, -sense b sin
     * c)`, with its first and second clock derivatives.
     */
    direction: (psi: number) => {
      d: [number, number];
      first: [number, number];
      second: [number, number];
    };

    /**
     * The clock of a chart point's foot on the curve along the ray from the
     * centre, in `[0, 2 pi)`: the correspondence across the seam.
     */
    clock: (u: number, v: number) => number;

    /**
     * Whether a chart point lies strictly inside the curve, on the side the
     * host removes.
     */
    inside: (u: number, v: number) => boolean;
  }
}
