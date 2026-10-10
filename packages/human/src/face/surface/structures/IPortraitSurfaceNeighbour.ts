/** One native edge neighbour and its construction-millimetre distance.
 *
 * @author Samchon
 */
export interface IPortraitSurfaceNeighbour {
  /** Adjacent vertex ordinal in the refined construction mesh. */
  vertex: number;

  /** Euclidean edge length to that vertex in construction millimetres. */
  length: number;
}
