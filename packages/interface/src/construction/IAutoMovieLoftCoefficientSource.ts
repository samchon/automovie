import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieStationHermite } from "./IAutoMovieStationHermite";

/**
 * Data and callback contracts shared by the LoftCoefficientSource operations.
 *
 * @evidence contracts/development/design.md#principled-representation The source records separate selected-coordinate coefficient derivatives and virtual pole endpoints from physical station derivatives; a null coordinate change leaves physical2 unavailable.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftCoefficientSource and station interpolation reuse StationHermite endpoints and the canonical outline parameter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Virtual finite derivatives do not claim regular mm derivatives at a singular pole; row compatibility is checked by the engine.
 * @evidence contracts/development/common.md#meaningful-documentation Describes endpoint units, interpolation weights and coordinate-change availability.
 */
export namespace IAutoMovieLoftCoefficientSource {
  /**
   * A finite virtual endpoint in the chosen coordinate, not a physical-station jet.
   *
   * @evidence contracts/development/design.md#principled-representation A closing pole contributes the zero section and its natural-spline parameter jets without placing a degenerate principal layer in the chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One station and one existing Hermite endpoint layout carry virtual cap data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite parameter slopes/curvatures make no claim of finite physical-station derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation Station uses kernel mm and slope/curvature use the selected parameter coordinate.
   */
  export interface IEnd extends IAutoMovieStationHermite.IEnd {
    /** Actual pole station, kernel mm. */
    station: number;

    /** Finite first derivatives in the chosen parameter, rather than per-mm station derivatives. */
    slope: readonly number[];

    /** Finite second derivatives in the chosen coordinate. */
    curvature: readonly number[];
  }

  /**
   * Optional virtual coefficient endpoints for actual closing ends.
   *
   * @evidence contracts/development/design.md#principled-representation Only a declared bottom/top pole receives a virtual zero section at its original station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional records distinguish open ends from single/both caps.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence does not invent a cap or extend an open end.
   * @evidence contracts/development/common.md#meaningful-documentation Members identify which end owns each finite parameter endpoint.
   */
  export interface IEnds {
    /** Virtual zero section of a bottom cap; absent at an open bottom. */
    bottom?: IAutoMovieLoftCoefficientSource.IEnd;

    /** Virtual zero section of a top cap; absent at an open top. */
    top?: IAutoMovieLoftCoefficientSource.IEnd;
  }

  /**
   * Direct parameter-derivative data of one principal coefficient row.
   *
   * @evidence contracts/development/design.md#principled-representation The layer's existing coefficients remain its values; these arrays supply their first/second derivatives in the explicit map, so equal-value copies retain the same interpolation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One map, two derivative arrays and shared endpoint data extend the existing principal-layer definition without a hidden source-value copy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A transformed endpoint must explicitly remove/re-express this parameter data; mismatched or absent endpoint maps select the documented station-Hermite boundary, never a fitted source.
   * @evidence contracts/development/common.md#meaningful-documentation Arrays use the existing coefficient layout; source data and the chain are immutable after preparation, as required by existing station caches.
   */
  export interface ISource {
    /** Admitted root/angle map with kernel-mm endpoints. */
    parameter: IAutoMovieConstructionOutlineParameter;

    /** First derivative of the layer's coefficients in that map. */
    slopes: readonly number[];

    /** Second derivative of the same coefficient row in that map. */
    curvatures: readonly number[];

    /** Shared finite virtual pole records. */
    ends: IAutoMovieLoftCoefficientSource.IEnds;
  }

  /**
   * One parameter span's direct endpoint arrays and three interpolation-weight rows.
   *
   * @evidence contracts/development/design.md#principled-representation Parameter Hermite weights and the forward map's optional station change define value and both physical derivative orders.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Existing Hermite endpoint arrays preserve lazy per-control combination in the consumer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null change keeps a finite parameter value but supplies no finite physical 2-jet.
   * @evidence contracts/development/common.md#meaningful-documentation Rows are value/first/second parameter orders; change is dq/ds,d2q/ds2.
   */
  export interface IControls {
    /** Lower endpoint values and parameter derivatives. */
    a: IAutoMovieStationHermite.IEnd;

    /** Upper endpoint values and parameter derivatives. */
    b: IAutoMovieStationHermite.IEnd;

    /** Value/first/second parameter-coordinate Hermite weights. */
    weights: number[][];

    /** Forward parameter derivatives in physical station, or null at a singular/nonfinite 2-jet. */
    change: [number, number] | null;
  }
}
