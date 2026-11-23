import type { IAutoMovieDrawingScheduleBox } from "./IAutoMovieDrawingScheduleBox";

/**
 * Where a space is, and what the design already declares about it.
 *
 * Each field delegates to the current environment's graph, box or metadata
 * query. Declared is a box of the space's own volume representation; content
 * folds descendant content proxies. Their tolerances and static-geometry
 * premises differ, so neither box independently proves actual visible occupancy
 * or a suitable camera view.
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
   * Rounded shell-vertex box or aggregate cell-axis-limit box for this space
   * alone. Null means no stated volume or failure of the helper's 1e-9
   * axis-component/finite-limit checks; a non-null box does not prove a
   * nonempty exact cell intersection.
   */
  declared: IAutoMovieDrawingScheduleBox | null;

  /**
   * Rounded box of static CPU element bounds and declared population placement
   * proxies in the subtree, or null when none contributes. Missing
   * external-model geometry and empty held geometry contribute an element
   * origin; attached bones, skinning, animation and GPU evaluation are outside
   * the measurement.
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
   * contributes its one owner id, `instance-set:<set>`, rather than its
   * members, so a field of thousands of slates is one entry.
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
