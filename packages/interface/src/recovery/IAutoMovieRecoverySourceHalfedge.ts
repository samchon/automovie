/** One directed boundary occurrence of a two-dimensional clipped source cell. */
export interface IAutoMovieRecoverySourceHalfedge {
  /**
   * Stable occurrence key combining clipped cell and original polygon-edge
   * position.
   */
  id: string;

  /** ID of the clipped cell carrying this occurrence. */
  cell: number;

  /** Original source triangle ordinal of the owning cell. */
  face: number;

  /** Raw source node ID at the occurrence start. */
  from: string;

  /** Raw source node ID at the occurrence end. */
  to: string;

  /** Shared declared source edge key or face-local clipping edge key. */
  edge: string;

  /** Scalar-boundary role from the occurrence endpoint heights. */
  side: "before" | "after" | "physical";

  /** Whether the edge has exactly one declared original source face incidence. */
  physicalBoundary: boolean;

  /** Connected two-dimensional clipped component that owns the occurrence. */
  component: number;
}
