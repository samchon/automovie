import type { AutoMovieHumanEmptyProbes } from "../AutoMovieHumanEmptyProbes";
import { AutoMovieHumanF1 } from "../AutoMovieHumanF1";

/*
 * F1's stored empty-probe listing. The owner namespace and this module expose
 * the same object, with the stored cutter and digit-family references.
 */
export const AutoMovieHumanF1EmptyProbes: AutoMovieHumanEmptyProbes.IListing =
  AutoMovieHumanF1.EMPTY_PROBES;
