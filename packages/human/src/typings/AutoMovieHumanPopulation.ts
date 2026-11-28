import type { AutoMovieHumanPopulation as AutoMovieHumanPopulationContract } from "@automovie/interface";

/**
 * Reference population labels for authored build traits.
 *
 * The traits record supplies a requested survey population alongside sex, age,
 * stature and build offsets. It also keeps skin tone independent of
 * population.
 */
export namespace AutoMovieHumanPopulation {
  /** Label the requested European reference population. */
  export const European: "european" = "european" satisfies
    AutoMovieHumanPopulationContract;
  /** Label the requested East Asian reference population. */
  export const EastAsian: "eastAsian" = "eastAsian" satisfies
    AutoMovieHumanPopulationContract;
  /** Label the requested African reference population. */
  export const African: "african" = "african" satisfies
    AutoMovieHumanPopulationContract;
}
