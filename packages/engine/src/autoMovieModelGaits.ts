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
 * @evidence requirements/formations/budgets-and-validation.md#formation-motion-validation Exposes the recipe-ordered gait repertoire used to reject unsupported formation motion cues.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Gives validation and runtime baking the same model capability list.
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
