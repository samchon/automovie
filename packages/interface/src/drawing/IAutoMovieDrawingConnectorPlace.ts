/**
 * Where a connector is: the regions its declared stops stand in.
 *
 * A run reaches every stop it declares, not only its two ends, so a lift
 * serving four floors states four. Matched exactly rather than through
 * containment, which is the rule the environment's own connector query follows.
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
