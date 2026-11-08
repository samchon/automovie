import type { IAutoMovieSimplexAtom } from "@automovie/engine";

import type { IAutoMovieRecoveryMapJointBlock } from "./IAutoMovieRecoveryMapJointBlock";

/**
 * Matching robust original-design blocks and unweighted physical constraints.
 *
 * @evidence contracts/development/design.md#principled-representation The same projection derivatives form the robust metric and every normalized pixel-disk inequality without applying robust weights to the hard bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A named output joins derivative production with original-rank metric and physical KKT consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No skipped measurement or changed residual population is represented.
 * @evidence contracts/development/common.md#meaningful-documentation Defines ordered blocks and objective-first physical row ordering.
 */
export interface IAutoMovieRecoveryFeasibleMapLinearization {
  /** Weighted original point/camera Jacobian rows for every landmark. */
  blocks: IAutoMovieRecoveryMapJointBlock[];

  /** Physical objective gradient first, then every unweighted disk derivative with offset minus g. */
  rows: IAutoMovieSimplexAtom[];
}
