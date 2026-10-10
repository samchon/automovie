/**
 * One cell of a source triangle tree: its parent-triangle ordinal and its
 * oriented canonical sample IDs, read against the parent's ordered corners.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCell {
  /** Ordinal of the parent triangle in the source tree. */
  parent: number;

  /** Oriented canonical sample IDs of the cell's corners. */
  samples: readonly number[];
}
