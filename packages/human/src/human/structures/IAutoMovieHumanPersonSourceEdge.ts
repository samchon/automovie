/**
 * One edge of a source cell while proving chart coverage: its first recorded
 * direction and how many cells have used the undirected edge.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceEdge {
  /** Sample ID the edge leaves in its first recorded direction. */
  from: number;

  /** Sample ID the edge reaches in its first recorded direction. */
  to: number;

  /** Number of cells that have used the edge, one or two. */
  count: number;
}
