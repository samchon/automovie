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
 * Returns null only when no profile declares gaits. This lookup does not check
 * for a skeleton; bakeFormationCycle owns whether that model can be animated.
 * The returned gait remains borrowed from the first nonempty profile list.
 */
export const formationCycleGait: (
  model: IAutoMovieModel,
) => IAutoMovieGait | null = (model: IAutoMovieModel): IAutoMovieGait | null =>
  autoMovieModelGaits(model)[0] ?? null;
