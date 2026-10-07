import type { IAutoMovieHumanFaceEyelidPhenotype } from "./IAutoMovieHumanFaceEyelidPhenotype";

/**
 * Independently authored left and right resting lid morphology.
 * Omission of one side retains its complete source appearance; no symmetry
 * expansion or ancestry preset fills that side.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelidPhenotypes {
  /** Anatomical-left visible lid traits. */
  left?: IAutoMovieHumanFaceEyelidPhenotype;

  /** Anatomical-right visible lid traits. */
  right?: IAutoMovieHumanFaceEyelidPhenotype;
}
