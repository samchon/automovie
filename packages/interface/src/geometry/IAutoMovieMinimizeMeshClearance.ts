/**
 * Solved forward-axis vertex travel restoring directional mesh clearance.
 *
 * Distances are nonnegative metres along the chosen positive axis and vertices
 * retain original front-mesh identities. Negative or nonfinite clearance and
 * incomplete solves refuse; results require remeasurement after skin
 * propagation or Float32 conversion and do not certify volume collision
 * freedom.
 */
export namespace IAutoMovieMinimizeMeshClearance {
  /**
   * The solved minimum joint forward travel of the front mesh's vertices along
   * one positive axis that restores a requested clearance over a back mesh.
   *
   * `measureMeshClearance` supplies every affine overlap witness, already-clear
   * ones included; each becomes the linear constraint that the barycentric
   * blend of its front vertices' travel closes its deficit. The objective is
   * half the sum of lumped mass times squared travel, each vertex's mass a
   * third of every incident triangle's area, an approximation of the surface
   * integral that infers no elasticity or tissue force. Each vertex travels
   * between zero and its largest incident face deficit, so no point moves
   * farther than the conservative per-triangle correction. Only vertices of
   * triangles with a positive deficit get a variable; the result lists them in
   * ascending vertex order with their travel in metres, and is empty when
   * nothing needs to move. Both meshes share the caller's frame and are only
   * read; this is directional ordering, not closed-volume collision or
   * anatomy.
   *
   * Travel is normalized by the largest cap and masses by their mean, scalar
   * changes that keep the minimizer. The solver accepts a row residual of 1e-7
   * in normalized travel units within 40 rounds; that is solver precision, not
   * added clearance. A negative or non-finite clearance throws, as do the
   * measurement's refusals and an incomplete or infeasible solve, rather than
   * returning the conservative or a relaxed result. Callers must re-check after
   * propagating the travel through a shared skin and after Float32 export.
   *
   * The list and entries transfer to the caller without changing either mesh.
   * An empty list means no positive directional deficit was found;
   * zero-distance entries may remain for vertices included in the solve.
   */
  export type IResult = IVertexTravel[];

  /** Solved forward-axis travel for one original front mesh vertex. */
  export type IVertexTravel = {
    /**
     * Original front vertex ordinal in ascending order; entries cover vertices
     * of positive-deficit triangles, including any solved zero travel.
     */
    vertex: number;

    /**
     * Solved nonnegative travel in metres along the selected positive axis,
     * bounded by that vertex's largest incident face deficit; the caller
     * applies it and rechecks downstream geometry.
     */
    distance: number;
  };
}
