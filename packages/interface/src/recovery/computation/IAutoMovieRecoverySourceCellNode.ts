/**
 * Symbolic vertex of a scalar-clipped source cell, before coefficient publication.
 * The scalar uses the source height chart in registered millimetres; raw and declared incidence identities remain distinct. Consumers read original vertex-ordinal support through a readonly list, and source admission owns its ranges.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States millimetre scalar coordinates, original vertex support and the distinction between raw and declared incidence identity.
 * @evidence contracts/development/design.md#principled-representation The node preserves both identity spaces and readonly original vertex-ordinal support; source admission validates ranges rather than deriving identity from coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegionCells creates these witnesses and topology and atlas observation consume them without inferring coordinate equality.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record carries source addresses, not generated geometry or a positional weld; its vertices may support a source edge rather than identify one original vertex.
 */
export interface IAutoMovieRecoverySourceCellNode {
  /** Stable identity within the owning chart, boundary or occurrence registry; equal coordinates do not create identity. */
  id: string;

  /** Declared connectivity identity, independent of physical coordinate equality. */
  incidenceId: string;

  /** Original source vertex ordinals supporting this symbolic observed node. */
  vertices: readonly number[];

  /** Node coordinate in the immutable registered scalar chart, in millimetres for recovery observations. */
  scalar: number;
}
