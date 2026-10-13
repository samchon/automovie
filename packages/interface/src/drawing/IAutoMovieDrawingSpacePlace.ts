import { IAutoMovieDrawingScheduleBox } from "./IAutoMovieDrawingScheduleBox";

/** Where a room is, and what the design already declares about it. */
export interface IAutoMovieDrawingSpacePlace {
  /** Discriminant naming the subject this place describes. */
  kind: "space";

  /** Building unit that owns the zone. */
  building: string;

  /**
   * Owning logical space, or `null` for a building root.
   *
   * Spaces nest, and a flattened index loses the question "which storey is
   * unreviewed", so the hierarchy is carried rather than dissolved.
   */
  parent: string | null;

  /**
   * World box of the zone's own declared volume, or `null` when it declares
   * none this derivation can bound.
   */
  declared: IAutoMovieDrawingScheduleBox | null;

  /**
   * World box the zone's contents fill, or `null` when nothing stands in it at
   * any depth.
   */
  content: IAutoMovieDrawingScheduleBox | null;

  /**
   * What the zone's declared volume claims to be, folded over its descendants.
   */
  fidelity: "exact" | "faceted" | "unstated";

  /**
   * Staged node ids in the zone and its descendants, ascending, bounded by
   * {@link AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS}.
   *
   * A compact population contributes its one owner id rather than its members,
   * so a field of 2,392 slates is one entry and not an unbounded expansion.
   */
  contents: string[];

  /**
   * Staged nodes the bound left out.
   *
   * `contents.length` plus this is the zone's full staged population, so the
   * count a reviewer needs is reproducible from a bounded row.
   */
  omittedContents: number;

  /** Zones directly joined to this one, ascending. */
  adjacent: string[];

  /** Connectors landing in this zone, ascending. */
  connectors: string[];
}
