import { IAutoMovieEnvironmentContext, IAutoMovieEnvironmentInstant } from "@automovie/interface";

/**
 * The instant of a context by id, or null when it names none.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `autoMovieEnvironmentInstant` resolves a requested time only from the context's declared calendar-and-sky states.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The lookup returns the matching explicit instant or null, leaving missing celestial input visible to the caller.
 */
export const autoMovieEnvironmentInstant = (
  context: IAutoMovieEnvironmentContext,
  id: string,
): IAutoMovieEnvironmentInstant | null =>
  context.instants.find((instant) => instant.id === id) ?? null;
