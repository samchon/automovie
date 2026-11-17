import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the AxisDirection operations. */
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
