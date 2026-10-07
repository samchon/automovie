import type { IAutoMovieHumanFaceBrowPopulation } from "./IAutoMovieHumanFaceBrowPopulation";

/**
 * Independent numerical populations for the registered left and right brow bands.
 *
 * Omission of the whole document section selects the population owner's
 * defaults for registered sides through resolveHumanFaceBrows. An explicit
 * sparse section retains its selection; an omitted side requests no numerical
 * replacement of that side's source cards.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBrows {
  /** Anatomical left population; omission in an explicit section retains source cards. */
  left?: IAutoMovieHumanFaceBrowPopulation;
  /** Anatomical right population, independent of the left request. */
  right?: IAutoMovieHumanFaceBrowPopulation;
}
