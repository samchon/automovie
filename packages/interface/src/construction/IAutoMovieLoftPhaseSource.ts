import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the LoftPhaseSource operations. */
export namespace IAutoMovieLoftPhaseSource {
  /**
   * Prepared natural-coordinate interpolation of native conic section
   * functions. The arrays index the same coordinates in increasing order. The
   * cardinal matrices carry derivatives with respect to the chosen coordinate q
   * and allow the section reader to blend radii and their phase derivatives
   * directly.
   */
  export interface ISource {
    /**
     * Increasing interpolation coordinates q ordered with the source curves.
     * Choose station millimetres, signed square-root millimetres or radians
     * according to the requested map.
     */
    coordinates: readonly number[];

    /**
     * Native polar conic sections in the same order as coordinates. Radii are
     * in millimetres and phase is in radians.
     */
    curves: readonly IAutoMovieViewConic.ICurve[];

    /**
     * First derivatives in q of the natural cardinal functions. Row i is
     * evaluated at coordinate i and column j weights source curve j.
     */
    slopes: readonly (readonly number[])[];

    /**
     * Second derivatives in q using the same coordinate-row and
     * source-curve-column order as slopes.
     */
    curvatures: readonly (readonly number[])[];
  }

  /**
   * Prepared value and derivative weights for one coordinate on a retained
   * native conic source. Supply physical change-of-coordinate derivatives to
   * the station reader when the returned weights will be used as station
   * derivatives.
   */
  export interface IStation {
    /**
     * Prepared conic functions and cardinal basis shared by every phase read at
     * this coordinate.
     */
    source: IAutoMovieLoftPhaseSource.ISource;

    /**
     * Rows for value, first derivative and second derivative, with one
     * coefficient for each source curve. The derivatives use q by default and
     * physical station after a supplied change of coordinate.
     */
    weights: readonly (readonly number[])[];
  }
}
