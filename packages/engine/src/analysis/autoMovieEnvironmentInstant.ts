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
 * @evidence contracts/common.md#principled-implementation A linear `Array.prototype.find` with strict string equality that returns the first match; under the context validator's uniqueness rule the first match is the only one.
 * @evidence contracts/common.md#clear-and-simple-design The daylight and envelope studies both resolve `request.instant` through this lookup, so the request check that refuses an undeclared instant and the solver body that reads it apply one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id is special-cased; `null` is the documented absent state, which each analyzer turns into a named refusal before its body asserts the lookup non-null with `!`.
 * @evidence contracts/common.md#meaningful-documentation States the exact-match rule, the `null` result, that uniqueness depends on prior validation, and that the returned instant aliases the context.
 * @evidence contracts/performance.md#cost-and-resources One O(instants) `find` that stops at the first match, with no cache: the daylight and envelope analyzers repeat the same lookup once while validating and once in the body instead of passing the resolved instant forward. Returns a reference into the caller's context and retains nothing.
 */
export const autoMovieEnvironmentInstant = (
  context: IAutoMovieEnvironmentContext,
  id: string,
): IAutoMovieEnvironmentInstant | null =>
  context.instants.find((instant) => instant.id === id) ?? null;
