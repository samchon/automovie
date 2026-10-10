/**
 * One performed cell's area vector (square metres, Y up, +Z forward) and the
 * flat offset of its parent triangle's slot in the parent area array.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellArea {
  /** Flat offset of the parent triangle's area-vector slot. */
  parent: number;

  /** The cell's area vector, square metres. */
  vector: number[];
}
