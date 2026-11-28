import type { IAutoMovieConstructionPortField } from "./IAutoMovieConstructionPortField";

/** The existing radial port chart and angle/length clock correspondence. */
export namespace IAutoMovieConstructionPortCurve {
  /**
   * Continuous port boundary in the host chart, with station in millimetres and
   * phase in radians. Its original clock gives the boundary point, inward
   * direction and their derivatives. Chart queries use the corresponding radial
   * angle and strict interior test.
   */
  export interface ICurve {
    /**
     * Host chart points of the band columns, in station millimetres and phase
     * radians.
     */
    addresses: [number, number][];

    /**
     * Unscaled inward ellipse directions at each column, in chart station and
     * phase units.
     */
    inward: [number, number][];

    /**
     * Station bounds in kernel millimetres enclosing the loop, from the centre
     * and maximum share bound.
     */
    reach: [number, number];

    /** Station semi-axis of the base ellipse, in kernel millimetres. */
    semi: number;

    /**
     * Periodic dimensionless radial scale read at the port clock. One gives the
     * base ellipse.
     */
    share: IAutoMovieConstructionPortField.IField;

    /**
     * Read the actual host chart point and its first and second derivatives per
     * port clock radian.
     */
    at: (psi: number) => {
      point: [number, number];
      first: [number, number];
      second: [number, number];
    };

    /**
     * Read the base ellipse's inward chart direction and its first two
     * port-clock derivatives. The station component is −a cos c and phase
     * component is −sense × b sin c.
     */
    direction: (psi: number) => {
      d: [number, number];
      first: [number, number];
      second: [number, number];
    };

    /**
     * Read the radial foot's clock in [0, 2π) at a host chart station and
     * phase. Input station uses millimetres and phase uses radians.
     */
    clock: (u: number, v: number) => number;

    /**
     * Test whether a host chart address lies strictly inside the original
     * curve. The centre lies inside.
     */
    inside: (u: number, v: number) => boolean;
  }
}
