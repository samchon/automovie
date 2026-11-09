import type { IAutoMovieSimplexAtom } from "@automovie/engine";

import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";

/**
 * One fixed arrowhead factor with an explicit pre-return whitening preflight.
 *
 * @evidence contracts/development/design.md#principled-representation The same point-first triangular factor supplies inverse-transpose covectors, inverse steps and transpose covectors. Nullable whitening exposes arithmetic absence only while the owning model can still choose its complete metric.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The formation owner uses tryWhiten on every fixed row before transferring the ordinary metric actions; generic direction work never selects a new metric.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caught action error, mixed-factor rows, late fallback, inverse matrix or pivot floor supplies support. Ordinary actions continue throwing on nonrepresentable output.
 * @evidence contracts/development/common.md#meaningful-documentation Nullable preflight is finite arithmetic support for one row, not a universal future-vector certificate, independent data rank or intended-Hessian accuracy claim.
 */
export interface IAutoMovieRecoveryMapTriangularMetric extends IAutoMovieRecoveryMapMetric {
  /**
   * Preflight one fixed inverse-transpose row before choosing the model metric.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Ordered finite original coefficients are scaled by the current original D and solved through the same point/camera transpose factors; only nonrepresentable arithmetic returns null.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Formation owns nullable support before model return; ordinary inverse/transpose actions keep their throwing contract afterward.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Malformed row ownership throws and no partial row, zero direction or late factor substitution becomes support.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows a sparse physical row and transfers a complete matching-offset row or null; success certifies this action only, not future vectors or normal convergence.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sparse metadata pass adds O(Zrow); k-point substitution costs O(kC+C^2) under the owner's prepaid complete-row allowance. Invariant factor/scale shapes are checked once rather than per row.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All preflight rows use the same already formed current factor and original scales without re-factorization.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Row output transfers only on complete support. Call-local Map/vectors expire; current factor/scales remain owned for this model and the borrowed row never escapes.
   */
  tryWhiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom | null;
}
