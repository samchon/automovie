import { IAutoMovieContextOccluder, IAutoMovieEnvironmentContext } from "@automovie/interface";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";

/**
 * Every context occluder as an analysis solid.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `autoMovieContextSolids` projects each read-only neighbouring mass into the common analysis-blocker shape.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The adapter preserves context ids and planes while furnishing the obstruction collection shared by lighting consumers.
 */
export const autoMovieContextSolids = (
  context: IAutoMovieEnvironmentContext,
): IAutoMovieAnalysisSolid[] =>
  context.occluders.map((occluder: IAutoMovieContextOccluder) => ({
    id: occluder.id,
    planes: occluder.planes,
  }));
