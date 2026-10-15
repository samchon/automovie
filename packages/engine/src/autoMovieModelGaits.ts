import { IAutoMovieGait, IAutoMovieModel } from "@automovie/interface";

/**
 * The gaits one runtime model can perform, in the order its profiles declare
 * them.
 *
 * The first profile that declares any owns the repertoire, which keeps the
 * choice in the model, where an author already orders them, instead of in
 * whichever consumer asked first. It lives here rather than beside the bake
 * because two consumers need the same answer for opposite reasons: the viewer
 * bakes a table per declared gait, and the formation-motion validator refuses
 * a cue calling for a gait that is not among them. Two spellings of "what can
 * this figure do" is how a production compiles clean and then fails to draw.
 *
 * Returns the profile's own `gaits` array, not a copy, so callers must not
 * mutate it. A model with no profiles, or whose profiles declare no gaits,
 * yields an empty array. Later profiles' gaits are ignored even when they
 * declare different ones.
 *
 * @param model Runtime model whose profiles are read.
 * @returns The first non-empty profile gait list, or an empty array.
 *
 * @evidence contracts/common.md#principled-implementation A first-match scan over the profiles in declaration order, which is the precedence the model author already controls; returning the stored array keeps its order exactly.
 * @evidence contracts/common.md#clear-and-simple-design One owner for a model's gait repertoire, shared by the viewer's gait bake and gait selection and by `validateAutoMovieFormationMotions`, so the validator and the renderer cannot disagree on which gaits exist.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No gait name, profile or model is special-cased, and no fallback gait is invented for a model that declares none.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the first-profile rule and why, who reads it, the aliasing of the returned array and the duty not to mutate it, the empty cases, and that later profiles are ignored.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the profile count with an early return, and no copy of the gait list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure lookup over one model that coordinates no work; it returns the model's own array, so repeated calls share it without a cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates nothing but a possible empty array and retains nothing; the returned list is owned by the model.
 */
export const autoMovieModelGaits: (
  model: Pick<IAutoMovieModel, "profiles">,
) => readonly IAutoMovieGait[] = (
  model: Pick<IAutoMovieModel, "profiles">,
): readonly IAutoMovieGait[] => {
  for (const profile of model.profiles ?? []) {
    const gaits: readonly IAutoMovieGait[] = profile.gaits ?? [];
    if (gaits.length !== 0) return gaits;
  }
  return [];
};
