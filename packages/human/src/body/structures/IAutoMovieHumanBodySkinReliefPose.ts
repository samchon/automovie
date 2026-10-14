import type { IAutoMovieHumanBodySkinReliefJoint } from "./IAutoMovieHumanBodySkinReliefJoint";

/**
 * How the skin's anatomical relief follows a pose: the joints whose creases
 * and wrinkles it carries, how far along and around each joint their skin
 * reaches, and how much a fold deepens or a stretch flattens them.
 *
 * @evidence contracts/common.md#principled-implementation Joint-local Gaussian reaches and independent deepening and flattening factors describe a pose-dependent relief response.
 * @evidence contracts/common.md#clear-and-simple-design A list of joint reach records separates anatomical placement from shared response strengths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The factors specify authored appearance, without claiming measured individual wrinkle mechanics.
 * @evidence contracts/common.md#meaningful-documentation Members describe reach ownership and dimensionless changes at the end of motion range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pose-dependent relief model is a data type with no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pose-dependent relief model declaration performs no request coordination or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pose-dependent relief model schema owns no runtime resource acquisition or release.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinReliefPose {
  /** The joints, each by the bone whose head it is. */
  joints: IAutoMovieHumanBodySkinReliefJoint[];

  /** How much a crease on the side the joint folds toward deepens at the end of the range, as a share of itself. */
  deepen: number;

  /** How much a wrinkle on the side the joint stretches flattens at the end of the range, as a share of itself. */
  flatten: number;
}
