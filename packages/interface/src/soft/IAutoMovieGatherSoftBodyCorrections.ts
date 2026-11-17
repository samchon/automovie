/**
 * Prepared lattice data for one simultaneous distance-constraint gather.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the stencil, simultaneous read/add lifecycle, metre displacements, zero/skipped cases and sole output buffer.
 * @evidence contracts/development/design.md#principled-representation P row-major particles require 3P coordinates, P masses/valences and 12P rest slots; numeric dimensions and compatible nonaliasing buffers remain runtime caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The core's preparation arrays directly serve gatherSoftBodyCorrections without per-sweep topology allocation or a separate solver state type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Three family weights are data rather than named special-case solvers; the request does not claim convergence or admission from a typed array alone.
 */
export namespace IAutoMovieGatherSoftBodyCorrections {
  /**
   * Caller-owned buffers for one Jacobi sweep: gatherSoftBodyCorrections reads all predicted positions before the caller adds the completed displacement buffer. Prediction and correction must use separate storage. Anchored or zero-valence particles receive zero correction; collapsed current edges are skipped.
   *
   * simulateSoftBodyCore prepares the row-major topology once per replay. Each particle has twelve ordered neighbour slots: (-1,0), (1,0), (0,-1), (0,1), (-1,-1), (1,-1), (-1,1), (1,1), (-2,0), (2,0), (0,-2), (0,2). Coordinates are column,row offsets; families are structural, shear and bend in those groups of four. Mirror-pair sums use a fixed fold order. This helper validates no dimensions, array lengths or arithmetic and retains no buffers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the stencil, simultaneous read/add lifecycle, metre displacements, zero/skipped cases and sole output buffer.
   * @evidence contracts/development/design.md#principled-representation P row-major particles require 3P coordinates, P masses/valences and 12P rest slots; numeric dimensions and compatible nonaliasing buffers remain runtime caller premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The core's preparation arrays directly serve gatherSoftBodyCorrections without per-sweep topology allocation or a separate solver state type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Three family weights are data rather than named special-case solvers; the request does not claim convergence or admission from a typed array alone.
   */
  export type IProps = {
    /** Positive integer lattice width; particle index is row * columns + column. */
    columns: number;

    /** Positive integer lattice height; P = columns * rows must match every working buffer. */
    rows: number;

    /** Read-only-for-this-call 3P packed world positions in metres at the start of this sweep. */
    predicted: Float64Array<ArrayBufferLike>;

    /** Writable 3P packed world-metre displacements, fully overwritten; the core adds these to predicted after return. */
    correction: Float64Array<ArrayBufferLike>;

    /** P inverse masses in kg^-1; zero holds a particle fixed. Borrowed without mutation. */
    inverseMass: Float64Array<ArrayBufferLike>;

    /** P counts of in-bounds stencil neighbours, including held neighbours; each nonzero count divides that particle's accumulated correction. */
    valence: Int32Array<ArrayBufferLike>;

    /** 12P rest distances in metres in the stated slot order; negative slots mark out-of-bounds neighbours and are skipped. */
    restLength: Float64Array<ArrayBufferLike>;

    /** Dimensionless structural, shear and bend weights at indices 0, 1 and 2; domain admission requires each in [0, 1]. */
    stiffness: number[];
  };
}
