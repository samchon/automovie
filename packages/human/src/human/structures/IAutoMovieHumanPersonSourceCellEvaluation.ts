/**
 * An admitted performed source evaluation: per original parent triangle its
 * accumulated area vector (flat triples, square metres), and each used
 * canonical sample's performed position (metres, Y up, +Z forward). Both are
 * owned.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellEvaluation {
  /** Accumulated area vector per parent triangle, flat triples, square metres. */
  parentAreas: number[];

  /** Performed position per used canonical sample ID, metres. */
  sourcePositions: ReadonlyMap<number, readonly number[]>;
}
