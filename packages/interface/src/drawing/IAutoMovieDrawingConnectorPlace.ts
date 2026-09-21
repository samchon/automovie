/**
 * Where a connector is: the regions its declared stops stand in.
 *
 * A run reaches every stop it declares, not only its two ends, so a lift
 * serving four floors states four. Matched exactly rather than through
 * containment, which is the rule the environment's own connector query follows.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `IAutoMovieDrawingConnectorPlace` as the location a connector row states, which the schedule requirement asks of every subject.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingConnectorPlace` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingConnectorPlace {
  /**
   * Discriminant naming the subject this place describes.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `kind` so a reader knows which location a row states before reading its fields.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `kind` for the interior space drawing schedule quantity system contract.
   */
  kind: "connector";

  /**
   * Building unit that owns the stops, or `null` when they name none a building
   * owns. A run between two units legitimately answers `null` rather than
   * choosing one of them.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `building` so a scheduled connector names the building unit it belongs to.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `building` for the interior space drawing schedule quantity system contract.
   */
  building: string | null;

  /**
   * Regions the connector's declared stops stand in, ascending.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `stops` so a connector row states which zones it lands in.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `stops` for the interior space drawing schedule quantity system contract.
   */
  stops: string[];
}
