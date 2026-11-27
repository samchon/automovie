/**
 * Input topology and independently owned output of a one-shot inverse
 * subdivision fit.
 */
export namespace IAutoMovieFitSubdivisionLimit {
  /**
   * Solve control positions of a quad cage whose Catmull-Clark limit surface
   * passes through given targets, one per vertex.
   *
   * The limit point of a cage vertex is a fixed linear combination of the
   * vertex and its one-ring. An interior vertex of valence `n` goes to `(n^2 P
   * + 4 sum E + sum D) / (n (n + 5))`, its edge neighbours `E` and the opposite
   * corners `D` of its quads (Halstead, Kass and DeRose 1993, SIGGRAPH,
   * "Efficient, fair interpolation using Catmull-Clark surfaces"); a boundary
   * vertex, whose boundary is an infinitely sharp crease, goes to `(A + 4 P +
   * B) / 6` along its two boundary neighbours, the cubic B-spline limit
   * `subdivideSurface` gives boundaries. Interpolation is the linear
   * system `L P = T`. It is solved by Jacobi iteration `P <- P + (T - L P)`
   * from `P = T`, which converges when every eigenvalue of `L` lies between 0
   * and 2; on a regular grid they lie between 1/9 and 1, for admitted regular
   * topology the stencil weights form convex combinations. It stops when the
   * largest residual falls below 1e-10 of the targets' extent or after 2,000
   * sweeps, and returns the last measured residual, so a caller can refuse a
   * fit that did not converge.
   *
   * Pinned vertices keep their target as their control position and are not
   * solved, which is how a cage meets a fixed junction ring exactly: their
   * limit points then depend on the cage around them.
   */
  export type IProps = {
    /**
     * Quad corner vertex indices, with consistent manifold winding as a caller
     * premise. stencilSubdivisionLimit checks quad cardinality,
     * integer index range, unused vertices and zero/two boundary edges per
     * vertex; it does not certify full manifoldness. Inputs are borrowed only
     * during the call.
     */
    faces: ReadonlyArray<readonly number[]>;

    /**
     * Packed XYZ limit targets in one common frame and length unit, metres for
     * surface networks. Length must be divisible by three; the wrapper checks
     * packing but does not check finite coordinates. An empty cage has empty
     * output and zero residual.
     */
    targets: readonly number[];

    /**
     * True holds that vertex's control at its target rather than solving its
     * limit point. Missing entries, including an omitted mask, mean false;
     * surplus entries are ignored.
     */
    pinned?: readonly boolean[];
  };

  /**
   * Controls and the last measured free-vertex residual from a one-shot fit.
   * The caller decides whether the residual is acceptable; the fitter returns
   * after its iteration cap without throwing for nonconvergence.
   */
  export type IResult = {
    /**
     * Newly allocated mutable packed XYZ controls, in targets' frame and unit.
     * Held controls equal their target; no storage is shared with input
     * arrays.
     */
    positions: number[];

    /**
     * Largest Euclidean free-vertex residual measured in the final iteration,
     * in the target length unit; zero if no vertex is free. Exhausting 2,000
     * iterations does not throw. At the iteration cap, a final residual
     * traversal measures the returned controls after the last permitted
     * update.
     */
    residual: number;
  };
}
