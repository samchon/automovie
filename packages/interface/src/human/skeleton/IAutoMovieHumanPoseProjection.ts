import type { IAutoMovieHumanBonePlacement } from "./IAutoMovieHumanBonePlacement";
import type { IAutoMovieHumanPoseClamp } from "./IAutoMovieHumanPoseClamp";

/** Independent requested placements and every canonical clamp, without exterior/rest materialization.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Independent requested placements and every canonical clamp, without exterior/rest materialization.
 * @evidence contracts/development/design.md#principled-representation `posed`: Requested bones in canonical parent-before-child order; arrays and tuples are owned. `clamped`: All requested out-of-range clinical fields, including those outside the selected branches.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanSkeleton.output.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `posed`, `clamped`; callers supply the complete record.
 */
export interface IAutoMovieHumanPoseProjection {
  /** Requested bones in canonical parent-before-child order; arrays and tuples are owned. */
  posed: IAutoMovieHumanBonePlacement[];

  /** All requested out-of-range clinical fields, including those outside the selected branches. */
  clamped: IAutoMovieHumanPoseClamp[];
}
