/** Data and callback contracts shared by the StationHermite operations. */
export namespace IAutoMovieStationHermite {
  /**
   * A layer's value, station slope and optional station curvature for one
   * equally sized array.
   */
  export interface IEnd {
    /** Values at the layer. */
    value: readonly number[];

    /**
     * First derivatives in the interpolation coordinate: per station mm
     * normally, or the explicit coefficient-source parameter.
     */
    slope: readonly number[];

    /** Second derivatives in that same coordinate; absent for a cubic end. */
    curvature?: readonly number[];
  }
}
