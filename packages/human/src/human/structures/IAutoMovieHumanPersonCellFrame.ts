/**
 * The oriented frame of one source cell: a row-major 3x3 matrix whose columns
 * are the two edge tangents (metres) and the scaled unit normal, and the
 * cell's doubled area, the length of the tangents' cross product (square
 * metres), in the shared Y-up, +Z-forward frame.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonCellFrame {
  /** Row-major 3x3 matrix of edge tangents and the scaled unit normal. */
  matrix: number[];

  /** Length of the tangents' cross product, square metres. */
  area: number;
}
