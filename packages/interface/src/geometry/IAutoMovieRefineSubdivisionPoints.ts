import type { IAutoMovieSubdivisionVertexMask } from "./IAutoMovieSubdivisionVertexMask";

/**
 * New Catmull-Clark points and the parent-vertex masks used to compute them.
 *
 * Packed XYZ positions retain local metres and are ordered by parent vertex,
 * edge and face. Supply admitted topology and its aligned finite positions.
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
   * Each returned array and mask belongs to the caller. The computation borrows
   * parent positions and topology during the step.
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
