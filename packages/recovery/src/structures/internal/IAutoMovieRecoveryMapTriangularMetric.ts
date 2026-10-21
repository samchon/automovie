import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoveryMapMetric } from "./IAutoMovieRecoveryMapMetric";

/**
 * One fixed arrowhead factor with an explicit pre-return whitening preflight.
 *
 * @evidence contracts/common.md#principled-implementation The same point-first triangular factor supplies inverse-transpose covectors, inverse steps and transpose covectors. Nullable whitening exposes arithmetic absence only while the owning model can still choose its complete metric.
 * @evidence contracts/common.md#clear-and-simple-design The formation owner uses tryWhiten on every fixed row before transferring the ordinary metric actions; generic direction work never selects a new metric.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caught action error, mixed-factor rows, late fallback, inverse matrix or pivot floor supplies support. Ordinary actions continue throwing on nonrepresentable output.
 * @evidence contracts/common.md#meaningful-documentation Nullable preflight is finite arithmetic support for one row, not a universal future-vector certificate, independent data rank or intended-Hessian accuracy claim.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased action surface performs no solve.
 * @evidence contracts/performance.md#reuse-equivalent-work Preflight and ordinary actions share exactly one current factor and original scale arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One closure owns current factor references for this model only; each preflight output transfers or expires before a whole-GN fallback.
 */
export interface IAutoMovieRecoveryMapTriangularMetric extends IAutoMovieRecoveryMapMetric {
  /**
   * Preflight one fixed inverse-transpose row before choosing the model metric.
   *
   * @evidence contracts/common.md#principled-implementation Ordered finite original coefficients are scaled by the current original D and solved through the same point/camera transpose factors; only nonrepresentable arithmetic returns null.
   * @evidence contracts/common.md#clear-and-simple-design Formation owns nullable support before model return; ordinary inverse/transpose actions keep their throwing contract afterward.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed row ownership throws and no partial row, zero direction or late factor substitution becomes support.
   * @evidence contracts/common.md#meaningful-documentation Borrows a sparse physical row and transfers a complete matching-offset row or null; success certifies this action only, not future vectors or normal convergence.
   * @evidence contracts/performance.md#efficient-algorithms One sparse metadata pass adds O(Zrow); k-point substitution costs O(kC+C^2) under the owner's prepaid complete-row allowance. Invariant factor/scale shapes are checked once rather than per row.
   * @evidence contracts/performance.md#reuse-equivalent-work All preflight rows use the same already formed current factor and original scales without re-factorization.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Row output transfers only on complete support. Call-local Map/vectors expire; current factor/scales remain owned for this model and the borrowed row never escapes.
   */
  tryWhiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom | null;
}
