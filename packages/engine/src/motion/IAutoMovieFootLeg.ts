import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * The leg chain that plants one foot: the foot end-effector and its upper/lower
 * segments (hip→knee, knee→ankle).
 *
 * @author Samchon
 */
export interface IAutoMovieFootLeg {
  /** Foot end-effector bone (the ground-contact point that is pinned). */
  foot: AutoMovieHumanoidBone;
  /** Upper leg segment (thigh): the chain root. */
  upper: AutoMovieHumanoidBone;
  /** Lower leg segment (shin). */
  lower: AutoMovieHumanoidBone;
}
