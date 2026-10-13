/**
 * Native construction edge incidence and millimetre length for the rim-distance field.
 *
 * @evidence contracts/common.md#principled-implementation One undirected endpoint pair stores complete refined-skin incidence and Euclidean millimetre length; one-face edges seed the discrete attachment-distance field.
 * @evidence contracts/common.md#clear-and-simple-design The record supplies only edge identity, incidence and cost; layer application owns graph construction and distance relaxation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material boundaries are not free rims because incidence is counted before material separation; graph distance is not an exact continuous geodesic.
 * @evidence contracts/common.md#meaningful-documentation Members state construction vertex ordinals, triangle incidence count and millimetre edge length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The edge record executes no incidence counting, length measurement or graph relaxation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Endpoints identify one graph arc but implement no cached distance or request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no adjacency map or queue; layer application owns actual edge records and buffers.
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
