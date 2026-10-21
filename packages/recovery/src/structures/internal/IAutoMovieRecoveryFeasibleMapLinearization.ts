import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoveryMapJointBlock } from "./IAutoMovieRecoveryMapJointBlock";

/**
 * Matching robust original-design blocks and unweighted physical constraints.
 *
 * @evidence contracts/common.md#principled-implementation The same projection derivatives form the robust metric and every normalized pixel-disk inequality without applying robust weights to the hard bound.
 * @evidence contracts/common.md#clear-and-simple-design A named output joins derivative production with original-rank metric and physical KKT consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No skipped measurement or changed residual population is represented.
 * @evidence contracts/common.md#meaningful-documentation Defines ordered blocks and objective-first physical row ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no linearization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current model owns O(E*C+L) weighted/sparse entries under the feasible joint admission.
 */
export interface IAutoMovieRecoveryFeasibleMapLinearization {
  /** Weighted original point/camera Jacobian rows for every landmark. */
  blocks: IAutoMovieRecoveryMapJointBlock[];

  /** Physical objective gradient first, then every unweighted disk derivative with offset minus g. */
  rows: IAutoMovieSimplexAtom[];
}
