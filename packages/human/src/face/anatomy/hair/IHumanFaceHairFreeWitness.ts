import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A point whose free distance to the closed collider was actually measured.
 *
 * Distance to a closed set is 1-Lipschitz, so `humanFaceHairFreeDistanceBound`
 * can prove a nearby candidate free from this one sample without a new query.
 * The contact projector and the ribbon mesher each keep their own latest
 * witness; it is copied and owned by that keeper.
 *
 * @author Samchon
 */
export interface IHumanFaceHairFreeWitness {
  /** The sampled point. */
  point: IAutoMovieVector3;

  /** Its measured signed free distance, in metres. */
  free: number;
}
