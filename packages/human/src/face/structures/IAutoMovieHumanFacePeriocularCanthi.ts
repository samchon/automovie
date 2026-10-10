import type { AutoMovieHumanFaceCanthusDefinition } from "./AutoMovieHumanFaceCanthusDefinition";

/**
 * One eye's medial and lateral canthus definitions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularCanthi {
  /** The medial canthus (endocanthion) definition. */
  medial: AutoMovieHumanFaceCanthusDefinition;

  /** The lateral canthus (exocanthion) definition. */
  lateral: AutoMovieHumanFaceCanthusDefinition;
}
