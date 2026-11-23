/** Result of inverting one local coordinate of an original native section. */
export namespace IAutoMovieNativeCoordinate {
  /**
   * Fresh mutable result after native coordinate inversion admits its residual.
   * Endpoints can succeed with zero bisection queries. Other successful results
   * have at most 64 midpoint queries and a finite residual within
   * 32_Number.EPSILON_max(1, abs(target), absolute native extents) millimetres.
   * Unreachable targets or a failed residual check throw an admission error.
   */
  export interface IResult {
    /**
     * Original polar radians in the selected half: component 1 uses
     * [-pi/2,pi/2] or [pi/2,3pi/2]; component 0 uses [0,pi] or [pi,2pi].
     */
    phase: number;

    /**
     * Original [x,z] section-plane point in millimetres, never adjusted to the
     * requested coordinate.
     */
    point: [number, number];

    /**
     * Actual selected point component minus the requested target, in
     * millimetres.
     */
    residual: number;

    /**
     * Total midpoint point queries, excluding both explicit endpoints; not just
     * the iteration that found the best point.
     */
    iterations: number;
  }
}
