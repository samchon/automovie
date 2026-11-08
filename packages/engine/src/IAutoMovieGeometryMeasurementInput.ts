import {
  AutoMovieGeometryQuery,
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieFormationDesign,
  IAutoMovieProductionDesign,
  IAutoMovieShotContract,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

/**
 * Borrow current design, compiled shot and optional canonical timeline records for one geometry measurement; the caller establishes that these snapshots agree.
 *
 * @evidence contracts/development/design.md#principled-representation Uses the same discriminated query and compiled shot records as the production oracle, with nullable production/world/timeline states explicitly represented instead of invented records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural input holds just the world, formation, shot and frame-format fields the eight query branches read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null world permits off-world ground answers; formation and camera queries separately require production format and film-time requires a timeline, without synthesized defaults for those dependencies.
 * @evidence contracts/development/common.md#meaningful-documentation Documents borrowed current records, id-keyed maps and the meanings of absent design and timeline snapshots.
 */
export interface IAutoMovieGeometryMeasurementInput {
  /** One compact geometry question. */
  request: AutoMovieGeometryQuery;

  /** Current design the question is asked of. */
  design: {
    /** Active production design, or null before one exists. */
    production: Pick<IAutoMovieProductionDesign, "frameFormat"> | null;

    /** Project-shared world design, or null before one exists. */
    world: Pick<
      IAutoMovieWorldDesign,
      "landmarks" | "surfaces" | "routes"
    > | null;

    /** Formation designs keyed by id. */
    formations: ReadonlyMap<
      string,
      Pick<IAutoMovieFormationDesign, "id" | "count" | "facingDeg">
    >;

    /** Shot contracts keyed by id. */
    shots: ReadonlyMap<
      string,
      Pick<IAutoMovieShotContract, "participants" | "camera">
    >;
  };

  /** Current compiled shots keyed by shot id. */
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;

  /** Canonical film timeline of the current compile, or null without one. */
  timeline: Pick<
    IAutoMovieFilmTimeline,
    "id" | "fps" | "totalFrames" | "segments"
  > | null;
}
