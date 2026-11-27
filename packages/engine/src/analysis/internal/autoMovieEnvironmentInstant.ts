import {
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
} from "@automovie/interface";

/*
 * Look up one environmental instant of a context by its id.
 *
 * Returns the first instant whose `id` equals `id` exactly, or `null` when the
 * context declares none. Ids are unique only once
 * `validateAutoMovieEnvironmentContext` has accepted the context. The result is
 * the context's own instant object, not a copy.
 * Parameter context: Environment context to search.
 * Parameter id: Instant id to match exactly, case and whitespace included.
 * Returns: The matching instant, or `null` when none matches.
 */
export function autoMovieEnvironmentInstant(
  context: IAutoMovieEnvironmentContext,
  id: string,
): IAutoMovieEnvironmentInstant | null {
  return (
    context.instants.find(
      (instant: IAutoMovieEnvironmentInstant): boolean => instant.id === id,
    ) ?? null
  );
}
