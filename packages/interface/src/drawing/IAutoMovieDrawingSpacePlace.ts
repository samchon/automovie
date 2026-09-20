import { IAutoMovieDrawingScheduleBox } from "./IAutoMovieDrawingScheduleBox";

/**
 * Where a room is, and what the design already declares about it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `IAutoMovieDrawingSpacePlace` as the location, membership and relation the schedule requirement asks a room row to provide.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingSpacePlace` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingSpacePlace {
  /**
   * Discriminant naming the subject this place describes.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `kind` so a reader knows which location a row states before reading its fields.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `kind` for the interior space drawing schedule quantity system contract.
   */
  kind: "space";

  /**
   * Building unit that owns the zone.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `building` so a scheduled zone names the building unit it belongs to.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `building` for the interior space drawing schedule quantity system contract.
   */
  building: string;

  /**
   * Owning logical space, or `null` for a building root.
   *
   * Spaces nest, and a flattened index loses the question "which storey is
   * unreviewed", so the hierarchy is carried rather than dissolved.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `parent` so a scheduled zone keeps its place in the space hierarchy.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `parent` for the interior space drawing schedule quantity system contract.
   */
  parent: string | null;

  /**
   * World box of the zone's own declared volume, or `null` when it declares
   * none this derivation can bound.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `declared` as the zone's own stated extent, kept apart from where its contents are.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `declared` for the interior space drawing schedule quantity system contract.
   */
  declared: IAutoMovieDrawingScheduleBox | null;

  /**
   * World box the zone's contents fill, or `null` when nothing stands in it at
   * any depth.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `content` as the measured extent of what stands in the zone rather than of the zone itself.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `content` for the interior space drawing schedule quantity system contract.
   */
  content: IAutoMovieDrawingScheduleBox | null;

  /**
   * What the zone's declared volume claims to be, folded over its descendants.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `fidelity` as the declared state of the zone's volume, which the schedule requirement counts among a row's relevant properties.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `fidelity` for the interior space drawing schedule quantity system contract.
   */
  fidelity: "exact" | "faceted" | "unstated";

  /**
   * Staged node ids in the zone and its descendants, ascending, bounded by
   * {@link AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS}.
   *
   * A compact population contributes its one owner id rather than its members,
   * so a field of 2,392 slates is one entry and not an unbounded expansion.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `contents` so a room row answers what stands in it by declared membership.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `contents` for the interior space drawing schedule quantity system contract.
   */
  contents: string[];

  /**
   * Staged nodes the bound left out.
   *
   * `contents.length` plus this is the zone's full staged population, so the
   * count a reviewer needs is reproducible from a bounded row.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `omittedContents` so the bounded content sample still reports the zone's whole count.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `omittedContents` for the interior space drawing schedule quantity system contract.
   */
  omittedContents: number;

  /**
   * Zones directly joined to this one, ascending.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `adjacent` so a scheduled zone states what it adjoins.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `adjacent` for the interior space drawing schedule quantity system contract.
   */
  adjacent: string[];

  /**
   * Connectors landing in this zone, ascending.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `connectors` so a scheduled zone states what reaches it.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `connectors` for the interior space drawing schedule quantity system contract.
   */
  connectors: string[];
}
