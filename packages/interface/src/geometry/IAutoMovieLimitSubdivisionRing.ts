/**
 * Limit position, sector normals and face-to-sector mapping of one vertex fan.
 *
 * Position uses the ring's local metres; normals are unit vectors in the same
 * frame and sectors are zero-based normal indices. The caller first exhausts
 * semi-sharp edges so sharpness is 0 or 10; undefined tangent planes and
 * vanishing or nonfinite normals refuse, while documented wide crease-sector
 * masks remain approximations.
 */
export namespace IAutoMovieLimitSubdivisionRing {
  /**
   * The limit position of a ring's vertex and one limit normal per sector of
   * faces between its infinitely sharp edges.
   *
   * Every edge must be smooth (0) or infinitely sharp (10);
   * `stepSubdivisionRing` spends any semi-sharp remainder first. A vertex with
   * no sharp edge is smooth: its limit is `(n^2 C + 4 sum E + sum D) / (n (n +
   * 5))` and its tangents are the cosine and sine masks with `A = 1 + cos(2 pi
   * / n) + cos(pi / n) sqrt(2 (9 + cos(2 pi / n)))` on the edges and `cos(2 pi
   * i / n) + cos(2 pi (i + 1) / n)` on the diagonals (Halstead, Kass and DeRose
   * 1993), giving one normal. A dart, with one sharp edge, has another
   * subdivision matrix, so its limit and tangents come from that matrix's
   * eigenvectors through `subdivisionRingEigenbasis`. An interior vertex of
   * valence two has no tangent plane and is refused, as is any vanishing or
   * non-finite normal.
   *
   * With two sharp edges the vertex is on a crease, whose limit is the B-spline
   * point `(A + 4 C + B) / 6` of the crease neighbours. Each side's normal
   * crosses the crease tangent with a cross tangent into that side. For a side
   * of two faces this is the regular B-spline cross derivative, exact. A side
   * of three faces refines on its own as a boundary ring whose dominant tangent
   * eigenvalues, about 0.580 across and 0.5 along the crease, stand clear of
   * the next, 0.410, so its exact tangents come from
   * `subdivisionRingEigenbasis`. Other sides take OpenSubdiv's masks, Biermann,
   * Levin and Zorin's (2000) for four or more faces and the
   * vertex-to-mean-of-crease-neighbours mask for one face. Those are
   * approximations with no exact replacement: under the standard crease rules a
   * side of four faces has a tie for its second tangent eigenvalue and a wider
   * side has two dominant eigenvalues above the crease's 0.5, while a side of
   * one face has a degenerate parametrisation, so the limit surface has no
   * tangent plane containing the crease there.
   *
   * With three or more sharp edges the vertex is a corner and stays put; each
   * sector's normal crosses the tangents of its two bounding crease curves,
   * which leave the corner along their edges, oriented by the sector's own
   * winding. A corner sector whose two crease curves leave in one line has no
   * tangent plane the curves determine, and takes the winding-weighted normal
   * of its ring quads instead.
   *
   * All returned arrays belong to the caller. Smooth-or-infinite sharpness and
   * aligned ring arrays are input premises; the result carries no indication
   * that an approximate wide-sector tangent mask was used.
   */
  export type IResult = {
    /**
     * New xyz limit point in the ring's local metre frame; a corner with at
     * least three sharp edges stays at its centre.
     */
    position: number[];

    /**
     * New unit xyz normal tuples, one per sector between sharp edges, or one
     * for a smooth/dart fan; orientation follows ring winding.
     */
    normals: number[][];

    /**
     * For each ring face in diagonal/fan order, the zero-based index into
     * normals; smooth and dart fans contain only zero.
     */
    sectors: number[];
  };
}
