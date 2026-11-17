/**
 * Data and callback contracts shared by the StationHermite operations.
 *
 * @evidence contracts/development/design.md#principled-representation IEnd stores equally sized value and first-derivative rows with optional second derivatives; station defaults to mm while explicit parameter-source callers supply their own coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface StationHermite interpolation and LoftCoefficientSource reuse the same endpoint array shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional curvature selects the supported cubic/quintic data boundary; row sizes and finite values remain interpolation premises.
 * @evidence contracts/development/common.md#meaningful-documentation Defines derivative order, selected coordinate and absent-curvature behavior.
 */
export namespace IAutoMovieStationHermite {
  /**
   * A layer's value, station slope and optional station curvature for one equally sized array.
   *
   * @evidence contracts/development/design.md#principled-representation Endpoint value/first jet and optional second jet determine the cubic or quintic station interpolant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record serves section, lift and flattened plane arrays without per-field interpolators.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional curvature marks available data; equal widths and finite entries are caller premises, not guaranteed by this structure.
   * @evidence contracts/development/common.md#meaningful-documentation Names per-station derivative units and the absent-curvature meaning.
   */
  export interface IEnd {
    /** Values at the layer. */
    value: readonly number[];

    /** First derivatives in the interpolation coordinate: per station mm normally, or the explicit coefficient-source parameter. */
    slope: readonly number[];

    /** Second derivatives in that same coordinate; absent for a cubic end. */
    curvature?: readonly number[];
  }
}
