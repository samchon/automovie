import {
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
} from "@automovie/interface";

/**
 * Look up one environmental instant of a context by its id.
 *
 * Returns the first instant whose `id` equals `id` exactly, or `null` when the
 * context declares none. Ids are unique only once
 * `validateAutoMovieEnvironmentContext` has accepted the context. The result is
 * the context's own instant object, not a copy.
 */
export const autoMovieEnvironmentInstant = (
  context: IAutoMovieEnvironmentContext,
  id: string,
): IAutoMovieEnvironmentInstant | null =>
  context.instants.find((instant) => instant.id === id) ?? null;
