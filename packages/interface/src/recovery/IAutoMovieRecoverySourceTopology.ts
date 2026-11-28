/** Combinatorial measures and qualification for one clipped source component. */
export interface IAutoMovieRecoverySourceTopology {
  /** Number of distinct node incidence identities in the clipped component. */
  vertices: number;

  /** Number of distinct clipped edge incidence keys in the component. */
  edges: number;

  /** Number of two-dimensional clipped source cells in the component. */
  faces: number;

  /**
   * Euler characteristic V minus E plus F for simple cells, or null when
   * undefined.
   */
  euler: number | null;

  /** Whether clipped incidence has qualified manifold edge and vertex links. */
  manifold: boolean;

  /**
   * Orientability under required face flips, or null when manifold incidence
   * does not qualify.
   */
  orientable: boolean | null;

  /**
   * Whether neighboring input faces already use opposite directions along their
   * shared edges.
   */
  inputOrientationConsistent: boolean;

  /**
   * Number of simple boundary cycles recovered by directed occurrence
   * traversal.
   */
  boundaryCycles: number;

  /**
   * Nonnegative orientable genus derived from Euler and complete cycle
   * evidence, or null.
   */
  genus: number | null;
}
