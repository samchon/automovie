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
 *
 * @param context Environment context to search.
 * @param id Instant id to match exactly, case and whitespace included.
 * @returns The matching instant, or `null` when none matches.
 *
 * @evidence contracts/common.md#principled-implementation A linear `Array.prototype.find` with strict string equality that returns the first match; under the context validator's uniqueness rule the first match is the only one.
 * @evidence contracts/common.md#clear-and-simple-design One named lookup shared by the daylight and envelope request checks, which turn `null` into a named refusal and hand the resolved instant forward instead of asserting a second lookup non-null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id is special-cased and no fallback instant is substituted; `null` is the documented absent state.
 * @evidence contracts/common.md#meaningful-documentation The documentation states exact matching, first-match behavior, when ids are unique, the `null` result, and that the instant is returned by reference.
 * @evidence contracts/performance.md#efficient-algorithms One O(I) scan over the I instants that stops at the first match; a context declares a handful of instants and each study resolves one, so an id index would cost more to build than the scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Each study resolves its instant once, in its request check, and passes the instant forward to the solve instead of looking it up again.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a reference into the caller's context and allocates or retains nothing.
 * @author Samchon
 */
export const autoMovieEnvironmentInstant: (
  context: IAutoMovieEnvironmentContext,
  id: string,
) => IAutoMovieEnvironmentInstant | null = (
  context: IAutoMovieEnvironmentContext,
  id: string,
): IAutoMovieEnvironmentInstant | null =>
  context.instants.find(
    (instant: IAutoMovieEnvironmentInstant): boolean => instant.id === id,
  ) ?? null;
