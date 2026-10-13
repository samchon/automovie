/**
 * Where a connector is: the regions its declared stops stand in.
 *
 * A run reaches every stop it declares, not only its two ends, so a lift
 * serving four floors states four. Stops are matched exactly rather than
 * through containment, the rule the environment's own connector query follows.
 *
 * The stops are the connector's `from`, every landing space and `to`,
 * deduplicated and sorted by `compareAutoMovieRenderIds`. `building` is the one
 * building unit those stops resolve to: stops that resolve to no unit are
 * ignored, and stops in two different units give `null`.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` collects `from`, the landing spaces and `to` into a set, sorts it, and resolves each stop with `builtEnvironmentBuildingOfSpace`, answering a unit only when exactly one distinct unit remains.
 * @evidence contracts/common.md#clear-and-simple-design The place is one arm of the schedule's place union, discriminated by `kind`, and holds only the stop list and the derived unit, so a connector row needs no geometry to say where it is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A run between two units answers `null` instead of picking the first unit found, and no stop is inferred from the route's geometry.
 * @evidence contracts/common.md#meaningful-documentation States which declarations become stops, their order and deduplication, the exact-match rule, and when `building` is null.
 * @author Samchon
 */
export interface IAutoMovieDrawingConnectorPlace {
  /** Discriminant naming the subject this place describes. */
  kind: "connector";

  /**
   * Building unit that owns the stops, or `null` when none resolves to a unit
   * or they resolve to two different units.
   */
  building: string | null;

  /** Space ids the connector's declared stops stand in, ascending. */
  stops: string[];
}
