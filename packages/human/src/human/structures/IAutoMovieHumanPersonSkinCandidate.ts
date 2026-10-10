import type { IAutoMovieHumanPersonSkinCandidateRegion } from "./IAutoMovieHumanPersonSkinCandidateRegion";

/**
 * The part of a basis surface that skin selection reads: its ID and its
 * regions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinCandidate {
  /** The surface's ID. */
  id: string;

  /** The surface's material regions. */
  regions: IAutoMovieHumanPersonSkinCandidateRegion[];
}
