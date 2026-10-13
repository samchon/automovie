import {
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
} from "@automovie/interface";

/** The instant of a context by id, or null when it names none. */
export const autoMovieEnvironmentInstant = (
  context: IAutoMovieEnvironmentContext,
  id: string,
): IAutoMovieEnvironmentInstant | null =>
  context.instants.find((instant) => instant.id === id) ?? null;
