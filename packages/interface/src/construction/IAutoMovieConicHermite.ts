/** Data and callback contracts shared by the ConicHermite operations. */
export namespace IAutoMovieConicHermite {
  /** One short rational cubic in deficit/height coordinates. */
  export interface IPatch<T = number> {
    /** First support extent, in the source length unit. */
    extent: T;

    /** Positive x deficit at the far endpoint, same length unit. */
    deficit: T;

    /** Positive y at the far endpoint, same length unit. */
    height: T;

    /** Far endpoint in the original quadratic's native parameter. */
    native: T;

    /** Far endpoint polar angle, radians. */
    angle: number;

    /** Shared geometric start curvature, inverse source length. */
    curvature: T;

    /** Four controls [x deficit / deficit, y / height]. */
    points: readonly (readonly [T, T])[];

    /**
     * Four positive rational weights; create normalizes the outer weights to
     * one.
     */
    weights: readonly T[];
  }
}
