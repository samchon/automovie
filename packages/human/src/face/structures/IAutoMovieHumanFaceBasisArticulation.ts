import type { IAutoMovieHumanFaceBasisEye } from "./IAutoMovieHumanFaceBasisEye";
import type { IAutoMovieHumanFaceBasisJaw } from "./IAutoMovieHumanFaceBasisJaw";

/**
 * The articulated performance of a face basis: one mandible and two globes
 * (`IAutoMovieHumanFaceBasis.articulation` states the model and its sources).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisArticulation {
  /** The mandible. */
  jaw: IAutoMovieHumanFaceBasisJaw;

  /** The globes, `leftEye` and `rightEye`. */
  eyes: IAutoMovieHumanFaceBasisEye[];
}
