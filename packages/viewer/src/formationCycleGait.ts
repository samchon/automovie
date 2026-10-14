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
 *
 * @evidence contracts/common.md#principled-implementation Selects the first gait of the engine's canonical first-nonempty profile repertoire, preserving authored profile/gait order; absence yields null but skeleton availability and actual bake admission belong to bakeFormationCycle, not this pure metadata lookup.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the shared repertoire owner rather than independently searching locomotion names or inferring a cycle from skeleton geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No preferred gait/model name, fallback profile or invented idle cycle changes the first-declaration rule; callers must not treat a returned metadata record as proof of successful animation.
 * @evidence contracts/common.md#meaningful-documentation Gives first-profile/gait precedence, borrowed result, null meaning and the distinct skeleton/bake responsibility instead of claiming the lookup refuses skeletonless models.
 * @evidence contracts/performance.md#efficient-algorithms Visits profile declarations until the first nonempty list and reads its first element, O(profile count) worst-case and constant adapter storage without copying gait data.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the engine's actual stored gait array/record and shared precedence law; mutable model profiles have no retained cross-call lookup cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows model/profile data and returns one borrowed gait or null, retaining no model, baked texture, native resource or task after return.
 */
export const formationCycleGait: (model: IAutoMovieModel) => IAutoMovieGait | null = (
  model: IAutoMovieModel,
): IAutoMovieGait | null => autoMovieModelGaits(model)[0] ?? null;
