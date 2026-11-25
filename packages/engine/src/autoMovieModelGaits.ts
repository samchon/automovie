import { IAutoMovieGait, IAutoMovieModel } from "@automovie/interface";

/**
 * The gaits one runtime model can perform, in the order its profiles declare
 * them.
 *
 * The first profile that declares any owns the repertoire, which keeps the
 * choice in the model, where an author already orders them, instead of in
 * whichever consumer asked first. It lives here rather than beside the bake
 * because two consumers need the same answer for opposite reasons: the viewer
 * bakes a table per declared gait, and the formation-motion validator refuses a
 * cue calling for a gait that is not among them. Two spellings of "what can
 * this figure do" is how a production compiles clean and then fails to draw.
 *
 * Returns the profile's own `gaits` array, not a copy, so callers must not
 * mutate it. A model with no profiles, or whose profiles declare no gaits,
 * yields an empty array. Later profiles' gaits are ignored even when they
 * declare different ones.
 *
 * @param model Runtime model whose profiles are read.
 * @returns The first non-empty profile gait list, or an empty array.
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
