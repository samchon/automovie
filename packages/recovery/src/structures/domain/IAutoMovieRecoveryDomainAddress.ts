/**
 * Original saved longitudinal interval and group address.
 *
 * @evidence contracts/development/design.md#principled-representation The interval ordinal and its local group ordinal identify the original saved longitudinal occurrence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A two-part address distinguishes a group from the same ordinal in another interval.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The address is a saved-graph identity, not a source-mesh index or spatial nearest match.
 * @evidence contracts/development/common.md#meaningful-documentation States the parent interval and interval-local group indexing scopes.
 */
export interface IAutoMovieRecoveryDomainAddress {
  /** Original saved longitudinal interval ordinal. */
  interval: number;

  /** Original saved group ordinal within its interval. */
  group: number;
}
