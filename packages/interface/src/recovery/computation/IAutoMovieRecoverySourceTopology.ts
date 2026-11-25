/**
 * Topology census of an observed edge-connected source-cell component. Counts
 * are dimensionless; Euler characteristic, orientability and genus remain null
 * where incidence does not qualify them. Input orientation consistency is
 * separate from mathematical orientability.
 */
export interface IAutoMovieRecoverySourceTopology {
  /** Vertex population in the component's observed incidence graph. */
  vertices: number;

  /** Distinct edge-incidence population used in Euler accounting. */
  edges: number;

  /** Two-dimensional source-cell population used in Euler accounting. */
  faces: number;

  /** Euler characteristic V-E+F, or null when topology cannot be qualified. */
  euler: number | null;

  /**
   * Whether local incidence meets the observer's manifold checks; no embedding
   * claim follows.
   */
  manifold: boolean;

  /** Whether face parity admits coherent orientation, or null when unqualified. */
  orientable: boolean | null;

  /** Whether supplied face directions already agree across adjacency. */
  inputOrientationConsistent: boolean;

  /** Number of closed boundary cycles in the observed relative sheet. */
  boundaryCycles: number;

  /** Genus of a qualified connected orientable sheet, otherwise null. */
  genus: number | null;
}
