/**
 * Where a connector is: the regions its declared stops stand in.
 *
 * A run reaches every stop it declares, not only its two ends, so a lift
 * serving four floors states four. Stops are matched exactly rather than
 * through containment, the rule the environment's own connector query follows.
 *
 * Stops are from, every landing space and to, deduplicated and sorted by compareAutoMovieRenderIds. Validated spaces each resolve to a building; exactly one distinct unit yields that id and multiple units yield null. The ownership query throws for undeclared or unowned spaces rather than ignoring them, and the stop list does not prove route traversal or point containment.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` collects `from`, the landing spaces and `to` into a set, sorts it, and resolves each stop with `builtEnvironmentBuildingOfSpace`, answering a unit only when exactly one distinct unit remains.
 * @evidence contracts/common.md#clear-and-simple-design The place is one arm of the schedule's place union, discriminated by `kind`, and holds only the stop list and the derived unit, so a connector row needs no geometry to say where it is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A run between two units answers `null` instead of picking the first unit found, and no stop is inferred from the route's geometry.
 * @evidence contracts/common.md#meaningful-documentation States which declarations become stops, their order and deduplication, the exact-match rule, and when `building` is null.
 */
export interface IAutoMovieDrawingConnectorPlace {
  /** Discriminant naming the subject this place describes. */
  kind: "connector";

  /**
   * The single building unit owning all stops, or null when stops span different units. The validated nonempty stop set has no unowned-space fallback.
   */
  building: string | null;

  /** Space ids the connector's declared stops stand in, ascending. */
  stops: string[];
}
