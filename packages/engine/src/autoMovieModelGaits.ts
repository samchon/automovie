import { IAutoMovieGait, IAutoMovieModel } from "@automovie/interface";

/**
 * The gaits one runtime model can perform, in the order its recipe declares
 * them.
 *
 * The first profile that declares any owns the repertoire, which keeps the
 * choice in the recipe, where an author already orders them, instead of in
 * whichever consumer asked first. It lives here rather than beside the bake
 * because two consumers need the same answer for opposite reasons: the viewer
 * bakes a table per declared gait, and the builder refuses a cue calling for a
 * gait that is not among them. Two spellings of "what can this figure do" is
 * how a production compiles clean and then fails to draw.
 *
 * Returns the recipe's own `gaits` array, not a copy, so callers must not
 * mutate it. A model with no profiles, or whose profiles declare no gaits,
 * yields an empty array.
 *
 * @evidence contracts/common.md#principled-implementation Returns the gaits of the first profile whose `gaits` list is non-empty, in declaration order, so the recipe's profile order decides the repertoire and gaits on later profiles are ignored.
 * @evidence contracts/common.md#clear-and-simple-design Lives in the engine so the viewer's per-gait bake and `validateAutoMovieFormationMotions` share one answer, and it accepts only `profiles` so either caller can pass a partial model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ignoring later profiles is the documented ownership rule rather than a fallback, absent `profiles` or `gaits` read as empty, and no gait name or profile is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the first-declaring-profile rule, the order, why the function lives here and which two consumers need it, the shared non-copied array, and the empty result.
 * @evidence contracts/performance.md#cost-and-resources Scans profiles until the first non-empty `gaits`, O(P) for P profiles, and returns the recipe's array without allocating; the bake and the validator each recompute it instead of caching, and nothing is retained.
 */
export const autoMovieModelGaits = (
  model: Pick<IAutoMovieModel, "profiles">,
): readonly IAutoMovieGait[] => {
  for (const profile of model.profiles ?? []) {
    const gaits = profile.gaits ?? [];
    if (gaits.length !== 0) return gaits;
  }
  return [];
};
