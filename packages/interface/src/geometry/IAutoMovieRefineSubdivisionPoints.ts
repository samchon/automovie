import type { IAutoMovieSubdivisionVertexMask } from "./IAutoMovieSubdivisionVertexMask";

/**
 * New Catmull-Clark points and the parent-vertex masks used to compute them.
 *
 * Packed xyz positions retain local metres; output order is parent vertices,
 * parent edges, then parent faces. This numerical step relies on admitted
 * topology and aligned finite position arrays; it does not perform cage
 * admission or repair.
 */
export namespace IAutoMovieRefineSubdivisionPoints {
  /**
   * The positions from one Catmull-Clark step: every vertex, edge and face
   * point of the next level.
   *
   * The output holds the vertex points in vertex order, then the edge points in
   * edge order, then the face points in face order. A face point is the average
   * of its corners. An edge point is `(A + B + F0 + F1) / 4`, the ends and the
   * two adjacent face points, blended towards the midpoint `(A + B) / 2` by
   * `subdivisionEdgeSmoothness`, so boundary and sharp edges take the midpoint.
   * A vertex point applies `subdivisionVertexMask` to the vertex, its edge
   * neighbours and the new face points of its fan.
   *
   * Both arrays and every returned mask belong to the caller. Finite aligned
   * positions and admitted connectivity are premises; this step neither mutates
   * nor retains the parent.
   */
  export type IResult = {
    /**
     * New packed xyz metre array of length 3(V+E+F), ordered by parent
     * vertices, edges and faces; the parent positions are unchanged.
     */
    points: number[];

    /**
     * New affine vertex masks, one per parent vertex in vertex order; their
     * edge and face weights follow that vertex's fan order and are reused for
     * UV refinement.
     */
    masks: IAutoMovieSubdivisionVertexMask[];
  };
}
