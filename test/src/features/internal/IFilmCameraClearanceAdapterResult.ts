import type { AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieViolationCollector } from "@automovie/interface";

/** The original clearance reports and addressed diagnostic collector. */
export interface IFilmCameraClearanceAdapterResult {
  /** Reports returned by the original compiler. */
  reports: ReturnType<typeof AutoMovieEngineFilm.compileCameraClearanceReports>;

  /** The same collector provided to that compiler. */
  out: IAutoMovieViolationCollector;
}
