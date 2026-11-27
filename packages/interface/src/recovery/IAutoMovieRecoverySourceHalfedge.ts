/**
 * Directed edge incidence of one observed source cell, including interior
 * edges. Cell, face and component are query-local/source ordinals as documented
 * on their fields; from/to/edge are incidence identities, not positions. Side
 * names the scalar stratum; physicalBoundary independently identifies a true
 * source boundary.
 */
export interface IAutoMovieRecoverySourceHalfedge {
  /**
   * Stable identity within the owning chart, boundary or occurrence registry;
   * equal coordinates do not create identity.
   */
  id: string;

  /** Query-local index into the observed cells array. */
  cell: number;

  /**
   * Original source-triangle ordinal, preserved through observation and
   * subdivision.
   */
  face: number;

  /** Identity of the directed source incidence at this edge's start. */
  from: string;

  /** Identity of the directed source incidence at this edge's end. */
  to: string;

  /**
   * Declared undirected edge identity; halfedge occurrences retain their own
   * direction and source-face ownership.
   */
  edge: string;

  /**
   * Scalar-boundary classification; physical alone does not establish a source
   * boundary.
   */
  side: "before" | "after" | "physical";

  /**
   * True when the declared source edge has exactly one original face
   * occurrence.
   */
  physicalBoundary: boolean;

  /** Query-local ordinal of the owning two-dimensional source component. */
  component: number;
}
