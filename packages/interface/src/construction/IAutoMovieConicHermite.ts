/**
 * Data and callback contracts shared by the ConicHermite operations.
 *
 * @evidence contracts/development/design.md#principled-representation IPatch keeps a rational cubic's deficit/height chart, source-length extents and inverse-length curvature with dimensionless controls and weights.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConicHermite prepares these records for ViewConic and ConicHermiteField; T shares numeric and source-jet formulas.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Array cardinality and positive weights are preparation premises, not guarantees of the readonly array types.
 * @evidence contracts/development/common.md#meaningful-documentation Gives patch coordinates, clock, control normalization and weight meaning.
 */
export namespace IAutoMovieConicHermite {
  /**
   * One short rational cubic in deficit/height coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation The native bound and positive rational controls describe the same G2 end arc used by point and arclength readers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed-size geometric data separates preparation from evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores no mesh, sampled fit or alternate anatomical source.
   * @evidence contracts/development/common.md#meaningful-documentation Members identify physical lengths, dimensionless controls and angular/native bounds.
   */
  export interface IPatch<T = number> {
    /** First support extent, in the source length unit. */
    extent: T;

    /** Positive x deficit at the far endpoint, same length unit. */
    deficit: T;

    /** Positive y at the far endpoint, same length unit. */
    height: T;

    /** Far endpoint in the original quadratic's native parameter. */
    native: T;

    /** Far endpoint polar angle, radians. */
    angle: number;

    /** Shared geometric start curvature, inverse source length. */
    curvature: T;

    /** Four controls [x deficit / deficit, y / height]. */
    points: readonly (readonly [T, T])[];

    /** Four positive rational weights; create normalizes the outer weights to one. */
    weights: readonly T[];
  }
}
