/**
 * Where a connector is: the regions its declared stops stand in.
 *
 * A run reaches every stop it declares, not only its two ends, so a lift
 * serving four floors states four. Matched exactly rather than through
 * containment, which is the rule the environment's own connector query follows.
 *
 * The stops are the connector's `from`, every landing space and `to`,
 * deduplicated and sorted by `compareAutoMovieRenderIds`. `building` is the one
 * building unit those stops resolve to: stops that resolve to no unit are
 * ignored, and stops in two different units give `null`.
 *
 * @evidence contracts/common.md#principled-implementation Membership by declared stop identity, the same exact-match rule `builtEnvironmentSpaceConnectors` applies, so a schedule row and a space query agree on where a connector is.
 * @evidence contracts/common.md#clear-and-simple-design One discriminant, one nullable building and one sorted list, the minimum a schedule row needs to place a connector beside the space and opening place variants.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `building` is `null` when stops span units instead of naming the first one, and stops without a unit are skipped rather than forcing `null`.
 * @evidence contracts/common.md#meaningful-documentation States which spaces count as stops, their deduplication and order, and every rule deciding `building`.
 * @author Samchon
 */
export interface IAutoMovieDrawingConnectorPlace {
  /** Discriminant naming the subject this place describes. */
  kind: "connector";

  /**
   * Building unit that owns the stops, or `null` when they name none a building
   * owns. A run between two units legitimately answers `null` rather than
   * choosing one of them.
   */
  building: string | null;

  /** Regions the connector's declared stops stand in, ascending. */
  stops: string[];
}
