/**
 * Data and callback contracts shared by the SeamStation operations.
 *
 * @evidence contracts/development/design.md#principled-representation ICopy carries coefficient and nine-component plane rows with first/second physical-station derivatives; orientation changes sign only on first derivatives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SeamStation copies a shared endpoint into the neighboring loft chart using the existing coefficient and frame layouts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Array lengths and matching source geometry are caller premises; a copied row is not an independent continuity certificate.
 * @evidence contracts/development/common.md#meaningful-documentation Defines plane layout and derivative sign transfer across a seam.
 */
export namespace IAutoMovieSeamStation {
  /**
   * A shared layer's copied section/plane values and station derivatives.
   *
   * @evidence contracts/development/design.md#principled-representation The record carries the owner's boundary data and both derivative orders after conversion to a neighbour's station direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six arrays separate section coefficients from flattened plane values and their derivatives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type certifies neither matching widths nor geometric equality; copy's producer premises and the continuation operator own those checks.
   * @evidence contracts/development/common.md#meaningful-documentation Names the nine-component plane layout, first-derivative sign and squared second-derivative factor.
   */
  export interface ICopy {
    /** The owner's coefficients. */
    coefficients: number[];

    /** The owner's plane as nine numbers `[origin, u, v]`; horizontal at its station when the owner's layer has no frame. */
    plane: number[];

    /** Station slopes, signed into the neighbour's direction. */
    slopes: number[];

    /** Second station derivatives; the sign squared leaves them as they are. */
    curvatures: number[];

    /** The plane's station slopes, signed. */
    frameSlopes: number[];

    /** The plane's second station derivatives. */
    frameCurvatures: number[];
  }
}
