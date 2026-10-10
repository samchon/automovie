import type { IAutoMovieHumanFaceCanthusExtreme } from "./IAutoMovieHumanFaceCanthusExtreme";
import type { IAutoMovieHumanFaceCanthusVertex } from "./IAutoMovieHumanFaceCanthusVertex";

/**
 * How a canthus is registered: an extreme of the joined margin rows along a
 * head-frame axis, or one fixed skin vertex where no extreme definition
 * exists.
 */
export type AutoMovieHumanFaceCanthusDefinition =
  | IAutoMovieHumanFaceCanthusExtreme
  | IAutoMovieHumanFaceCanthusVertex;
