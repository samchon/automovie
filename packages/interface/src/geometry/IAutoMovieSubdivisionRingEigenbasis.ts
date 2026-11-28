/**
 * A ring's evaluated limit point and two dominant tangent directions.
 *
 * The result contains one spatial point and two XYZ tangent vectors in the
 * ring's local frame. Tangent scale and sign are arbitrary. Supply an admitted
 * ring with stable sharpness. The fixed 512 steps approximate the masks. The
 * consumer checks whether their cross product defines a normal.
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
   * uses this for darts and three-face crease sides. Iteration accuracy depends
   * on the gap between the tangent subspace and remaining eigenvalues.
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
