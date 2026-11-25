/**
 * Where a connector is: the regions its declared stops stand in.
 *
 * A run reaches every stop it declares, not only its two ends, so a lift
 * serving four floors states four. Stops are matched exactly rather than
 * through containment, the rule the environment's own connector query follows.
 *
 * Stops are from, every landing space and to, deduplicated and sorted by
 * compareAutoMovieRenderIds. Validated spaces each resolve to a building;
 * exactly one distinct unit yields that id and multiple units yield null. The
 * ownership query throws for undeclared or unowned spaces rather than ignoring
 * them, and the stop list does not prove route traversal or point containment.
 */
export interface IAutoMovieDrawingConnectorPlace {
  /** Discriminant naming the subject this place describes. */
  kind: "connector";

  /**
   * The single building unit owning all stops, or null when stops span
   * different units. The validated nonempty stop set has no unowned-space
   * fallback.
   */
  building: string | null;

  /** Space ids the connector's declared stops stand in, ascending. */
  stops: string[];
}
