import type { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";
import type { IAutoMovieFilmTimeline } from "./IAutoMovieFilmTimeline";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieGeometryQuery } from "./IAutoMovieGeometryQuery";
import type { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import type { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Borrow current design, compiled shot and optional canonical timeline records
 * for one geometry measurement; the caller establishes that these snapshots
 * agree.
 */
export interface IAutoMovieGeometryMeasurementInput {
  /** One compact geometry question. */
  request: IAutoMovieGeometryQuery;

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
