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
   */
  whiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom;

  /** Apply inverse upper-factor action and restore physical parameter column units.
   */
  unwhiten: (step: readonly number[]) => number[];

  /** Multiply by the physical metric factor transpose, in camera-first order.
   */
  toPhysicalCovector: (value: readonly number[]) => number[];
}
