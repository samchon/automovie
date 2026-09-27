/**
 * How the skin's anatomical relief follows a pose: the joints whose creases
 * and wrinkles it carries, how far along and around each joint their skin
 * reaches, and how much a fold deepens or a stretch flattens them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Types the joints and factors by which the skin's creases follow a pose, as data a user can read.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Declares the relief-pose table: joints with their axial width and reach, and the deepening and flattening factors.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinReliefPose {
  /** The joints, each by the bone whose head it is. */
  joints: IAutoMovieHumanBodySkinReliefPose.IJoint[];

  /** How much a crease on the side the joint folds toward deepens at the end of the range, as a share of itself. */
  deepen: number;

  /** How much a wrinkle on the side the joint stretches flattens at the end of the range, as a share of itself. */
  flatten: number;
}
export namespace IAutoMovieHumanBodySkinReliefPose {
  /** One joint's reach over the skin. */
  export interface IJoint {
    /** The bone whose head the joint is, with each side's `left`/`right` prefix left off. */
    bone: string;

    /** Width in metres, along the bone, of the Gaussian over which the joint's skin creases. */
    sigmaMetres: number;

    /** Distance in metres from the bone's axis past which skin is another limb's. */
    reachMetres: number;
  }
}
