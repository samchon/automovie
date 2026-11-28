/** Data and callback contracts shared by the StationHermite operations. */
export namespace IAutoMovieStationHermite {
  /**
   * Value and derivative rows for one Hermite endpoint. Use matching array
   * lengths and order. Derivatives use the interpolation coordinate, normally
   * physical station in millimetres. Supply curvature at both ends for quintic
   * interpolation; cubic interpolation uses the two values and slopes.
   */
  export interface IEnd {
    /** Endpoint values in the field owner's order and units. */
    value: readonly number[];

    /**
     * First derivatives of the corresponding values in the interpolation
     * coordinate, normally per station millimetre.
     */
    slope: readonly number[];

    /**
     * Second derivatives in the same coordinate and value order. Cubic ends may
     * omit this row.
     */
    curvature?: readonly number[];
  }
}
