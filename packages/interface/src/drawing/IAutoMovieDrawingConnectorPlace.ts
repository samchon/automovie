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
