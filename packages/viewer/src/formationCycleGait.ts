import { autoMovieModelGaits } from "@automovie/engine";
import type { IAutoMovieGait, IAutoMovieModel } from "@automovie/interface";

/**
 * The cycle a runtime model performs by default, or null when it performs none.
 *
 * A gait is declarative profile data ({@link IAutoMovieGait}): per-limb phase,
 * duty and amplitude, the same rows the engine synthesises a named performer's
 * locomotion from. The first declared one is what a unit performs until a cue
 * calls for another.
 *
 * A model with no skeleton, or with no profile that locomotes, has no cycle at
 * all and keeps standing exactly as it did before.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
 */
export const formationCycleGait = (
  model: IAutoMovieModel,
): IAutoMovieGait | null => autoMovieModelGaits(model)[0] ?? null;
