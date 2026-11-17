/**
 * Directed edge incidence of one observed source cell, including interior edges.
 * Cell, face and component are query-local/source ordinals as documented on their fields; from/to/edge are incidence identities, not positions. Side names the scalar stratum; physicalBoundary independently identifies a true source boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the raw endpoint identity space, source-face and query-local ownership, and separates scalar side from actual source boundary incidence.
 * @evidence contracts/development/design.md#principled-representation Named incidence addresses retain directed edges without coordinate equality; side is a closed scalar-stratum choice and physicalBoundary records the independent source-boundary predicate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Event-region topology produces this incidence and slab observation copies it for provenance; both use the same identity semantics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parallel or coincident occurrences remain separate. The record claims neither coefficient ownership nor a manifold certificate.
 */
export interface IAutoMovieRecoverySourceHalfedge {
  /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
  id: string;

  /** Query-local index into the observed cells array. */
  cell: number;

  /** Original source-triangle ordinal, preserved through observation and subdivision. */
  face: number;

  /** Identity of the directed source incidence at this edge's start. */
  from: string;

  /** Identity of the directed source incidence at this edge's end. */
  to: string;

  /** Declared undirected edge identity; halfedge occurrences retain their own direction and source-face ownership. */
  edge: string;

  /** Scalar-boundary classification; physical alone does not establish a source boundary. */
  side: "before" | "after" | "physical";

  /** True when the declared source edge has exactly one original face occurrence. */
  physicalBoundary: boolean;

  /** Query-local ordinal of the owning two-dimensional source component. */
  component: number;
}
