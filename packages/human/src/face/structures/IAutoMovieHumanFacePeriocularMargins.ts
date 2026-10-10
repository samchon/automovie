import type { IAutoMovieHumanFacePeriocularLashRoots } from "./IAutoMovieHumanFacePeriocularLashRoots";

/**
 * One eye's upper and lower lid margins on the skin surface.
 *
 * Each margin is an ordered row of skin vertices from the medial to the
 * lateral end. Positions are read on the final shaped and posed Float32 skin,
 * so the margins follow every edit and expression.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularMargins {
  /** ID of the skin surface that carries the margins. */
  surface: string;

  /** Upper margin vertex indices, ordered medial to lateral. */
  upper: number[];

  /** Lower margin vertex indices, ordered medial to lateral. */
  lower: number[];

  /**
   * Optional anterior root rows on this surface. Omission leaves numerical
   * lashes unavailable; the posterior margin is not substituted for a root.
   */
  lashRoots?: IAutoMovieHumanFacePeriocularLashRoots;
}
