import type { IAutoMovieHumanParameters } from "../IAutoMovieHumanParameters";
import type { IAutoMovieHumanPoseProjection } from "./IAutoMovieHumanPoseProjection";

/** A fixed bone selection, with fresh results under every current input pose. Omitted pose means an empty clinical pose (neutral); omitted clamp is true.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A fixed bone selection, with fresh results under every current input pose.
 * @evidence contracts/development/design.md#principled-representation A fixed bone selection, with fresh results under every current input pose. The callable takes pose (optional), clamp (optional) and returns IProjection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanPoseProjectionEvaluator is the canonical exchange used by AutoMovieHumanSkeleton.prepare.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSkeleton.prepare for a fixed bone selection, with fresh results under every current input pose.
 */
export type AutoMovieHumanPoseProjectionEvaluator = (
  pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
  clamp?: boolean,
) => IAutoMovieHumanPoseProjection;
