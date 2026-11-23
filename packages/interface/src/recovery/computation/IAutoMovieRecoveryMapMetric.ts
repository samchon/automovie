import type { IAutoMovieSimplexAtom } from "../../index";

/** Invertible point-first upper-factor metric in physical camera-then-point coordinates.
 *
 * @evidence contracts/development/design.md#principled-representation Retained upper point blocks/cross tails and the upper camera factor define one consistently original-column-scaled numerical metric. GN obtains them by raw QR; an explicitly admitted lagged curvature model uses point/Schur Cholesky. Neither formation supplies independent original data rank, and transpose/backward actions avoid an inverse or full all-point matrix.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One owned factor supplies covector whitening and physical step recovery to the feasible joint consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These actions supply no data rank; independent undamped qualification must already have passed and a zero triangular pivot throws.
 * @evidence contracts/development/common.md#meaningful-documentation Defines physical layout, inverse-transpose covectors and inverse steps.
 */
export interface IAutoMovieRecoveryMapMetric {
  /** Camera width plus three coordinates for each ordered landmark. */
  width: number;

  /** Apply inverse-transpose upper-factor action to a physical covector.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows a sorted sparse physical row and returns its owned metric row with the same affine offset.
   */
  whiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom;

  /** Apply inverse upper-factor action and restore physical parameter column units.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows a width-coordinate metric vector and returns an owned physical increment; invalid dimensions or pivots throw.
   */
  unwhiten: (step: readonly number[]) => number[];

  /** Multiply by the physical metric factor transpose, in camera-first order.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows a width metric covector and returns an owned physical covector; nonfinite output throws.
   */
  toPhysicalCovector: (value: readonly number[]) => number[];
}
