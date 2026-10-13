import { IAutoMovieDrawingScheduleBox } from "./IAutoMovieDrawingScheduleBox";

/**
 * Where a space is, and what the design already declares about it.
 *
 * Every field is the answer of one built-environment query, so this record
 * repeats what the environment says rather than deriving a second opinion.
 * {@link declared} and {@link content} are deliberately two boxes: the first is
 * how far the space reaches, the second is where its contents actually stand,
 * and a camera aimed by the first can frame an empty corner.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawingSchedule` fills each field from one query: `builtEnvironmentBuildingOfSpace`, the space's own `parent`, `autoMovieDrawingSpaceBox`, `builtEnvironmentSpaceContentBounds`, `builtEnvironmentSpaceFidelity`, `builtEnvironmentSpaceNodes`, `builtEnvironmentAdjacentSpaces` and `builtEnvironmentSpaceConnectors`, sorting every id list with `compareAutoMovieRenderIds`.
 * @evidence contracts/common.md#clear-and-simple-design The place copies query answers instead of computing its own, so the schedule and the environment cannot disagree, and the hierarchy, boxes, contents and relations sit on one record a reviewer reads per space.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contents come from the declared `space` of elements and populations, never from id prefixes, and a population is named once by its owner id rather than expanded or sampled.
 * @evidence contracts/common.md#meaningful-documentation States the one-query-per-field rule and why two boxes exist; members give when each nullable field is `null`, the descendant folding of `content`, `fidelity` and `contents`, the id spellings and bound of `contents`, how to recover the full count, and the exact-match rule of `connectors`.
 * @author Samchon
 */
export interface IAutoMovieDrawingSpacePlace {
  /** Discriminant naming the subject this place describes. */
  kind: "space";

  /** Building unit that owns the space through its root ancestor. */
  building: string;

  /**
   * Parent logical space, or `null` for a building root.
   *
   * The hierarchy is carried rather than flattened, so a reader can still ask
   * which storey a room belongs to.
   */
  parent: string | null;

  /**
   * World box of the space's own declared volume, or `null` when it declares
   * none or its cells are not all axis-aligned and closed.
   */
  declared: IAutoMovieDrawingScheduleBox | null;

  /**
   * World box the contents of the space and its descendants fill, or `null`
   * when nothing is staged in it at any depth.
   */
  content: IAutoMovieDrawingScheduleBox | null;

  /**
   * What the declared volumes of the space and its descendants claim to be:
   * `faceted` when any of them approximates a curved region, `unstated` when
   * none states a volume, and `exact` otherwise.
   */
  fidelity: "exact" | "faceted" | "unstated";

  /**
   * Staged node ids in the space and its descendants, ascending, at most the
   * engine's `AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS`.
   *
   * An element with a model appears as `<environment>/<element>`. A population
   * contributes its one owner id, `instance-set:<set>`, rather than its members,
   * so a field of thousands of slates is one entry.
   */
  contents: string[];

  /**
   * Staged nodes the bound left out; `contents.length` plus this is the full
   * staged population of the space.
   */
  omittedContents: number;

  /**
   * Spaces joined to this one by a shared boundary, or by a connector that
   * travels from here to them, ascending.
   */
  adjacent: string[];

  /**
   * Connectors whose declared stops name this space itself, not one of its
   * descendants, ascending.
   */
  connectors: string[];
}
