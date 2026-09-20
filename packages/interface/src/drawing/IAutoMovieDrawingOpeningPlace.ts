/**
 * Where an opening is: the boundary hosting it and the regions that boundary
 * separates.
 *
 * An opening has no contents, no declared volume, no measured content bounds
 * and no fidelity, so it answered `null` while this record was a room's alone —
 * and the schedule filed a permanent gap saying its location had to be read
 * from the design instead. The design always held the answer: an opening names
 * its host `boundary`, and a boundary names the one region it encloses or the
 * two it separates.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `IAutoMovieDrawingOpeningPlace` as the location an opening row states, which the schedule requirement asks of every subject.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingOpeningPlace` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingOpeningPlace {
  /**
   * Discriminant naming the subject this place describes.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `kind` so a reader knows which location a row states before reading its fields.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `kind` for the interior space drawing schedule quantity system contract.
   */
  kind: "opening";

  /**
   * Building unit that owns the host boundary's regions, or `null` when they do
   * not agree on one — a boundary between two units belongs to neither alone,
   * and naming one of them would be a choice this derivation has no basis for.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `building` so a scheduled opening names the building unit it belongs to.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `building` for the interior space drawing schedule quantity system contract.
   */
  building: string | null;

  /**
   * Boundary hosting the opening.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `boundary` as the separation an opening is cut into.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `boundary` for the interior space drawing schedule quantity system contract.
   */
  boundary: string;

  /**
   * Regions the host boundary encloses or separates, ascending.
   *
   * One entry where the boundary encloses a single region, two where it stands
   * between a pair, and never none: validation refuses a boundary that cites no
   * region, with *"a boundary must enclose one space or separate two, but cited
   * 0"*, and this derivation runs after that check.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `separates` so an opening row states which zones it stands between.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `separates` for the interior space drawing schedule quantity system contract.
   */
  separates: string[];
}
