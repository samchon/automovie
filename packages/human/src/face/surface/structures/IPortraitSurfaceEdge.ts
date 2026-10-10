/** Native construction edge incidence and millimetre length for the existing rim-distance field.
 *
 * @author Samchon
 */
export interface IPortraitSurfaceEdge {
  /** First construction vertex ordinal of this undirected edge. */
  a: number;

  /** Second construction vertex ordinal of this undirected edge. */
  b: number;

  /** Number of refined construction triangles incident to the edge. */
  count: number;

  /** Euclidean edge length in construction millimetres. */
  length: number;
}
