import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Data and callback contracts shared by the AxisDirection operations.
 *
 * @evidence contracts/development/design.md#principled-representation Projection records keep a vector and its normal/target norms in one positive homogeneous scale; finite nonzero projection admission belongs to AxisDirection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interface owns IProjection for AxisDirection and ViewAxis so both read the same scaled direction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fallback direction or acceptance flag is encoded; the numeric record alone cannot certify conditioning.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the common projection scale and the normal-to-target ratio.
 */
export namespace IAutoMovieAxisDirection {
  /**
   * A projected direction and its same-scale norms for unitization and relative conditioning.
   *
   * @evidence contracts/development/design.md#principled-representation Projection and target norms share whichever positive homogeneous scale was used, so their ratio is the relative normal projection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One vector and two scalars carry all projection ownership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No acceptance or geometric replacement is encoded in this numeric record.
   * @evidence contracts/development/common.md#meaningful-documentation Members state the adjusted direction scale and its norm interpretation.
   */
  export interface IProjection {
    /** Direction in the original or positively scaled input's normal plane. */
    vector: AutoMovieVector3Tuple;
    /** Norm of vector in that same scale. */
    normalNorm: number;
    /** Full target norm in the same scale; ratio normalNorm/targetNorm drives admission. */
    targetNorm: number;
  }
}
