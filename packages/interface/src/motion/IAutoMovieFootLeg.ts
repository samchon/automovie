import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * The leg chain that plants one foot: the foot end-effector and its upper/lower
 * segments from hip to knee and knee to ankle. Bone slots must resolve on the
 * supplied skeleton; plantStanceFeet's defaults come from AutoMovieEngineHumanoidLegChains.
 */
export interface IAutoMovieFootLeg {
  /** Foot end-effector bone (the ground-contact point that is pinned). */
  foot: AutoMovieHumanoidBone;

  /** Upper leg segment (thigh): the chain root. */
  upper: AutoMovieHumanoidBone;

  /** Lower leg segment (shin). */
  lower: AutoMovieHumanoidBone;
}
