/**
 * The quad one-ring of one vertex: the vertex, its edge neighbours, its
 * diagonal neighbours and the sharpness of its edges.
 *
 * Edge `i` and diagonal `i` follow the fan order of `ISubdivisionTopology`:
 * diagonal `i` is the corner opposite the vertex in the quad between edges `i`
 * and `i + 1`. An interior ring has as many edges as diagonals and wraps; a
 * boundary ring has one edge more and its first and last edges are the
 * boundary, at sharpness 10. The limit position and tangent masks of
 * Catmull-Clark read exactly these points.
 *
 * @evidence contracts/common.md#principled-implementation After one refinement every face is a quad, so a vertex's neighbourhood is its centre, edge neighbours and diagonals, the support of the published limit and tangent masks and of one more refinement of the ring itself.
 * @evidence contracts/common.md#clear-and-simple-design Packed coordinates in fan order with the edge sharpness, the least a ring step and the limit masks need.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary edges stay at sharpness 10 so the ring step and limit treat them by the same sharp rules.
 * @evidence contracts/common.md#meaningful-documentation States the order, the meaning of diagonal `i`, the interior and boundary shapes and why these points suffice.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; the step and limit costs are answered on their functions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per vertex for its limit.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Arrays sized by one vertex's valence, released after its limit is written.
 */
export interface ISubdivisionRing {
  /** The vertex, as `[x, y, z]`. */
  centre: number[];

  /** Packed edge neighbours in fan order. */
  edges: number[];

  /** Packed diagonal neighbours in fan order. */
  diagonals: number[];

  /** Sharpness of each edge, 10 for boundary edges. */
  sharpness: number[];
}
