import { IAutoMovieDrawingScheduleBox } from "./IAutoMovieDrawingScheduleBox";

/**
 * Where a room is, and what the design already declares about it.
 *
 * Every field is the answer of one built-environment query, so this record
 * repeats what the environment says rather than deriving a second opinion.
 *
 * @evidence contracts/common.md#principled-implementation `spaceOccurrences` fills each field from an environment query (`builtEnvironmentBuildingOfSpace`, `builtEnvironmentSpaceNodes`, `builtEnvironmentSpaceContentBounds`, `builtEnvironmentSpaceFidelity`, adjacency and connector lookups), while `declared` is exact for a shell and for closed axis-aligned cells and `null` for any other cell shape.
 * @evidence contracts/common.md#clear-and-simple-design Declared extent, content extent, membership and relations sit side by side because they answer different reviewer questions, and every list is either bounded or id-only so a crowded room stays a small row.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A population is listed by its single `instance-set:` owner id instead of its members, a declared bound rather than a truncation; `building` is a plain string because validation guarantees each space an owning unit and the query throws otherwise.
 * @evidence contracts/common.md#meaningful-documentation Separates the declared box from the content box, explains the nullable parent and boxes, the member bound, the id spellings in `contents`, how `omittedContents` restores the full count, and how adjacency and connectors are matched.
 * @author Samchon
 */
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
   * An element with a model appears as `<environment>/<element>`. A compact
   * population contributes its one owner id, `instance-set:<set>`, rather than
   * its members, so a field of 2,392 slates is one entry and not an unbounded
   * expansion.
   */
  contents: string[];

  /**
   * Staged nodes the bound left out.
   *
   * `contents.length` plus this is the zone's full staged population, so the
   * count a reviewer needs is reproducible from a bounded row.
   */
  omittedContents: number;

  /**
   * Zones joined to this one by a shared boundary or by a connector that
   * travels from here to them, ascending.
   */
  adjacent: string[];

  /**
   * Connectors whose declared stops name this zone itself, not one of its
   * descendants, ascending.
   */
  connectors: string[];
}
