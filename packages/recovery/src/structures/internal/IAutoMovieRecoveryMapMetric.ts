import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

/**
 * Invertible point-first QR metric in physical camera-then-point coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Retained upper point blocks and the reduced upper camera factor represent one consistently column-scaled damped original design. Transpose and backward actions avoid an inverse or full all-point matrix.
 * @evidence contracts/common.md#clear-and-simple-design One owned factor supplies covector whitening and physical step recovery to the feasible joint consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These actions supply no data rank; independent undamped qualification must already have passed and a zero triangular pivot throws.
 * @evidence contracts/common.md#meaningful-documentation Defines physical layout, inverse-transpose covectors and inverse steps.
 * @evidence contracts/performance.md#efficient-algorithms Factors retain O(L*C+C^2) scalars; one sparse-point covector costs O(C^2+C), while a full covector or step costs O(L*C+C^2).
 * @evidence contracts/performance.md#reuse-equivalent-work Every inequality uses the same current weighted damped factor; any change in state, loss weights or damping requires a new factor.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Closures own the current factors and scales for one model lifetime, with no global cache, image or external handle.
 */
export interface IAutoMovieRecoveryMapMetric {
  /** Camera width plus three coordinates for each ordered landmark. */
  width: number;

  /**
   * Apply inverse-transpose QR action to a column-unscaled physical covector.
   *
   * @evidence contracts/common.md#principled-implementation Point-first transpose triangular substitution and the common column scales compute R^-T without a normal matrix or inverse.
   * @evidence contracts/common.md#clear-and-simple-design One metric closure serves objective and every hard-constraint covector in the same coordinates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero pivots refuse and the damped action supplies no independent data-rank evidence.
   * @evidence contracts/common.md#meaningful-documentation Borrows a sorted sparse physical row and returns its owned metric row with the same affine offset.
   * @evidence contracts/performance.md#efficient-algorithms A one-point covector costs O(C^2+C); a full covector costs O(L*C+C^2), under the caller's preallocation and work admission.
   * @evidence contracts/performance.md#reuse-equivalent-work All rows share the current weighted damped factors; state/weight/damping changes invalidate them together.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owned output transfers and local substitution scratch expires; the closure retains bounded current factors only.
   */
  whiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom;

  /**
   * Apply inverse QR action and restore physical parameter column units.
   *
   * @evidence contracts/common.md#principled-implementation Camera back substitution followed by point-block recovery inverts the same ordered metric used for whitening.
   * @evidence contracts/common.md#clear-and-simple-design The action restores camera-then-point coordinates for the actual retraction owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No pivot floor, full inverse or independent later-translation normalization changes the authored step.
   * @evidence contracts/common.md#meaningful-documentation Borrows a width-coordinate metric vector and returns an owned physical increment; invalid dimensions or pivots throw.
   * @evidence contracts/performance.md#efficient-algorithms One full step costs O(L*C+C^2) with O(width) local/output storage, admitted and charged by the camera owner.
   * @evidence contracts/performance.md#reuse-equivalent-work The same current factors and column scales serve every backtrack direction conversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Output transfers without retaining the borrowed input; current factors expire with their model closure.
   */
  unwhiten: (step: readonly number[]) => number[];
}
