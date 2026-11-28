/**
 * Topology and orientation summary of one edge-connected component after shared
 * corner welding.
 */
export interface IAutoMovieMeshPiece {
  /**
   * Lowest zero-based source triangle ordinal in the component. It orders the
   * returned components.
   */
  firstTriangle: number;

  /**
   * Number of distinct welded identities used by this component, using explicit
   * physical identities when present.
   */
  vertices: number;

  /** Number of distinct undirected welded pairs among the component's triangles. */
  edges: number;

  /**
   * Count of triangles in this component after lattice-collapsed triangles are
   * excluded.
   */
  faces: number;

  /**
   * Count of connected components formed by edges used once. A closed component
   * returns zero.
   *
   * For a manifold component these components are the boundary loops.
   * Nonmanifold pieces also retain the connected-component count.
   */
  boundaryLoops: number;

  /**
   * Euler characteristic computed from component counts as vertices minus edges
   * plus faces.
   */
  euler: number;

  /**
   * True when every edge has at most two uses and every component vertex has
   * one triangle fan.
   */
  manifold: boolean;

  /**
   * Whether consistent face orientation is possible by selective flips. The
   * test returns null for a nonmanifold component.
   */
  orientable: boolean | null;

  /**
   * Whether each multiply used edge has equal counts in both directions under
   * the stored triangle ordering.
   */
  consistentlyWound: boolean;

  /**
   * Handle count derived from Euler characteristic and boundary count for an
   * orientable manifold. Other components yield null.
   */
  genus: number | null;
}
