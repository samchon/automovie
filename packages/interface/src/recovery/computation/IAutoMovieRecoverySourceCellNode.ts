/**
 * Symbolic vertex of a scalar-clipped source cell, before coefficient
 * publication. The scalar uses the source height chart in registered
 * millimetres; raw and declared incidence identities remain distinct. Consumers
 * read original vertex-ordinal support through a readonly list, and source
 * admission owns its ranges.
 */
export interface IAutoMovieRecoverySourceCellNode {
  /**
   * Stable identity within the owning chart, boundary or occurrence registry;
   * equal coordinates do not create identity.
   */
  id: string;

  /**
   * Declared connectivity identity, independent of physical coordinate
   * equality.
   */
  incidenceId: string;

  /** Original source vertex ordinals supporting this symbolic observed node. */
  vertices: readonly number[];

  /**
   * Node coordinate in the immutable registered scalar chart, in millimetres
   * for recovery observations.
   */
  scalar: number;
}
