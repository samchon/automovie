import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieStationHermite } from "./IAutoMovieStationHermite";

/** Data and callback contracts shared by the LoftCoefficientSource operations. */
export namespace IAutoMovieLoftCoefficientSource {
  /**
   * Virtual zero-section endpoint at a real closed pole. The physical station
   * is in millimetres. The value and both derivative arrays use the principal
   * coefficient order, and the derivatives are with respect to the selected
   * root or angle coordinate.
   */
  export interface IEnd extends IAutoMovieStationHermite.IEnd {
    /** Physical station of the closed pole, in millimetres. */
    station: number;

    /**
     * First derivative of each coefficient with respect to the selected root or
     * angle coordinate, in coefficient order.
     */
    slope: readonly number[];

    /**
     * Second derivative of each coefficient with respect to the same
     * coordinate, in coefficient order.
     */
    curvature: readonly number[];
  }

  /**
   * Virtual coefficient endpoints associated with a prepared root or angle map.
   * Include an endpoint for each closed end named by the chain and the map.
   */
  export interface IEnds {
    /**
     * Virtual zero-coefficient endpoint below the first principal layer,
     * present for a closed bottom.
     */
    bottom?: IAutoMovieLoftCoefficientSource.IEnd;

    /**
     * Virtual zero-coefficient endpoint above the last principal layer, present
     * for a closed top.
     */
    top?: IAutoMovieLoftCoefficientSource.IEnd;
  }

  /**
   * Direct root- or angle-coordinate coefficient derivatives at one principal
   * layer. Keep the map and virtual endpoints consistent across layers prepared
   * together. The layer's ordinary slope and curvature fields retain
   * physical-station derivatives.
   */
  export interface ISource {
    /**
     * Admitted root or angle map from physical station in millimetres to the
     * coefficient interpolation coordinate.
     */
    parameter: IAutoMovieConstructionOutlineParameter;

    /**
     * First parameter derivative of each coefficient in the containing layer's
     * value order.
     */
    slopes: readonly number[];

    /**
     * Second parameter derivative in the same order as slopes and layer
     * coefficient values.
     */
    curvatures: readonly number[];

    /**
     * Virtual endpoint records for the closed ends, shared by the prepared
     * principal layers.
     */
    ends: IAutoMovieLoftCoefficientSource.IEnds;
  }

  /**
   * Lower and upper Hermite data and three parameter-coordinate weight rows for
   * the span containing a requested station. The rows evaluate value, first
   * derivative and second derivative in that order. A station read transforms
   * the derivative rows with dq/ds and d²q/ds² when available. Value evaluation
   * remains available without that conversion.
   */
  export interface IControls {
    /**
     * Hermite values and parameter derivatives at the lower endpoint of the
     * span.
     */
    a: IAutoMovieStationHermite.IEnd;

    /**
     * Hermite values and parameter derivatives at the upper endpoint of the
     * span.
     */
    b: IAutoMovieStationHermite.IEnd;

    /**
     * Hermite weights for value, first derivative and second derivative with
     * respect to the interpolation parameter.
     */
    weights: number[][];

    /**
     * [dq/ds, d²q/ds²] for parameter q and physical station s in millimetres,
     * or null when the forward two-jet is unavailable.
     */
    change: [number, number] | null;
  }
}
