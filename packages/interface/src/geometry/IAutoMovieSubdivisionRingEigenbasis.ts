/**
 * A ring's evaluated limit point and two dominant tangent directions.
 *
 * The result contains spatial xyz vectors in the ring's local metre frame, not
 * eigenvector coefficients; tangents have arbitrary mask scale and are not unit
 * normals. The caller supplies an admitted ring with stable sharpness; fixed
 * 512-step iteration has no independent convergence certificate and
 * limitSubdivisionRing validates the resulting normal.
 */
export namespace IAutoMovieSubdivisionRingEigenbasis {
  /**
   * The limit point and two tangent vectors of a ring's vertex, from the
   * dominant left eigenvectors of the ring's own subdivision matrix.
   *
   * Refining a one-ring is linear in its points, so it is a square matrix `S`
   * over the centre, edge neighbours and diagonals, built here by refining one
   * unit ring per point with `stepSubdivisionRing`. Because the rules are
   * affine, `S` keeps constants, so its dominant eigenvalue is 1 and the
   * matching left eigenvector, scaled to sum 1, is the limit-position mask; the
   * two dominant left eigenvectors among the masks that sum to zero span the
   * tangent masks (Halstead, Kass and DeRose 1993 derive the smooth case in
   * closed form). Both are found by iteration on `S` from the left: plain power
   * iteration for the limit, and orthogonal iteration of a two-dimensional
   * zero-sum subspace for the tangents, re-orthonormalised every step so the
   * weaker tangent is never lost to the stronger one. `limitSubdivisionRing`
   * uses this for darts and for crease sides of three faces, whose sharp edges
   * give them other matrices than the published masks assume. The tangent
   * search converges at the ratio of the third to the second dominant zero-sum
   * eigenvalue, about 0.94 for a dart of valence 12, so `EIGEN_STEPS`
   * iterations reach rounding.
   *
   * All vectors are newly allocated. Their lengths and finiteness are not
   * separately checked here; limitSubdivisionRing owns normal normalization and
   * refusal after taking their cross product.
   */
  export type IResult = {
    /**
     * New xyz point obtained by applying the dominant affine eigenmask to the
     * input ring, in the ring's local metre frame.
     */
    limit: number[];

    /**
     * Two new xyz vectors from zero-sum tangent masks, in local metre
     * coordinates with arbitrary scale and sign; the limit-ring consumer
     * crosses and orients them before normalization.
     */
    tangents: number[][];
  };
}
