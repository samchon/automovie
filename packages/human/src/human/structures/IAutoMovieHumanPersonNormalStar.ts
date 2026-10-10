/**
 * One source-star accumulation during normal transport: the reference-area
 * weighted sum of transported densities, the star's ancestral unit normal,
 * and whether any incident cell changed.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalStar {
  /** Reference-area weighted sum of transported densities. */
  sum: number[];

  /** The star's ancestral unit normal. */
  reference: readonly number[];

  /** Whether any incident fixed cell moved. */
  changed: boolean;
}
