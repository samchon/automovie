import type { IAutoMovieHumanPersonSourceCell } from "./IAutoMovieHumanPersonSourceCell";

/**
 * One fixed source normal cell: a source cell with exactly three oriented
 * canonical samples and one deformation-side domain per corner.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalCell extends IAutoMovieHumanPersonSourceCell {
  /** Oriented canonical sample IDs of the three corners. */
  samples: [number, number, number];

  /** Nonnegative deformation-side domain of each corner. */
  domains: [number, number, number];
}
