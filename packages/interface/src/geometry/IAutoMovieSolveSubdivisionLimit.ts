import type { IAutoMovieSubdivisionStencil } from "./IAutoMovieSubdivisionStencil";

/**
 * Borrowed stencils, targets and writable buffers for an in-place inverse
 * subdivision solve.
 */
export namespace IAutoMovieSolveSubdivisionLimit {
  /**
   * Solve, in place, the control positions whose Catmull-Clark limit points are
   * the targets.
   *
   * The free vertices satisfy `L P = T` for the limit stencils `L`, solved by
   * Jacobi iteration `P <- P + (T - L P)` from `P = T`; held vertices keep
   * their target as their control position. The iteration converges when every
   * eigenvalue of `L` lies between 0 and 2; on a regular grid they lie between
   * 1/9 and 1. It stops when the largest residual of a free vertex falls below
   * 1e-10 of the targets' extent or after 2,000 sweeps, and returns that
   * residual, so a caller can refuse a fit that did not converge. At the
   * iteration cap, one final residual evaluation measures the returned controls
   * after the last update. Empty or entirely held systems return zero. No input
   * validation or buffer allocation occurs in this kernel.
   */
  export type IProps = {
    /**
     * Borrowed Catmull-Clark limit stencil defining the vertex count and
     * weighted control neighbours. The caller supplies valid in-range stencil
     * indices.
     */
    stencil: IAutoMovieSubdivisionStencil;
    /**
     * Borrowed finite packed XYZ targets, at least 3 * stencil.count entries in
     * one spatial unit. Measured residuals use that same unit.
     */
    targets: ArrayLike<number>;
    /**
     * Per-vertex mask: zero holds a control at its target, nonzero allows
     * Jacobi updates. Caller provides one entry per stencil vertex; the
     * conventional values are 0 and 1.
     */
    free: Uint8Array;
    /**
     * Writable packed control output. The solver first copies targets into this
     * buffer. Provide at least 3 * stencil.count slots distinct from scratch
     * and target storage.
     */
    positions: IPropsPositions;
    /**
     * Separate writable buffer with at least 3 * stencil.count slots. It
     * alternates with positions during Jacobi updates and has unspecified
     * contents on return.
     */
    scratch: IPropsScratch;
  };

  /** The scratch object of {@link IProps}. */
  export type IPropsScratch = {
    /**
     * Writable packed XYZ scratch slots, distinct from target and position
     * storage. Buffer overlap is not detected by the solver.
     */
    [index: number]: number;
    /**
     * Available scalar capacity, at least three times the stencil vertex count.
     * The solver assumes valid indexed writes and does not allocate replacement
     * storage.
     */
    length: number;
  };

  /** The positions object of {@link IProps}. */
  export type IPropsPositions = {
    /**
     * Mutable scalar slots in packed XYZ order; writes are synchronous and the
     * solver retains no buffer after return.
     */
    [index: number]: number;
    /**
     * Available scalar capacity, at least three times the stencil vertex count;
     * this is a caller precondition rather than a runtime length guard.
     */
    length: number;
  };
}
