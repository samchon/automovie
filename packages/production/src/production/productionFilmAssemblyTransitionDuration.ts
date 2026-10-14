import { IAutoMovieFilmTimeline } from "@automovie/interface";

/**
 * Read an admitted normalized transition's frame duration, interpreting a cut as zero overlap or effect length.
 *
 * @evidence contracts/common.md#principled-implementation Field presence returns the previously normalized durationFrames for fade or dissolve and zero for a cut, whose normalized record omits that field. It relies on transition normalization rather than repeating positive-grid validation.
 * @evidence contracts/common.md#clear-and-simple-design The scalar accessor lets video validation compare incoming and outgoing kinds and lengths without repeating representation-specific field access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero for cut follows the normalized timeline representation; no missing duration is guessed for non-cut inputs and no transition kind is rewritten.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies frame units, cut semantics, and the premise that duration-bearing transitions have already been normalized.
 * @evidence contracts/performance.md#efficient-algorithms One field-presence check and scalar read take constant work and allocate no transition or array.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing normalized segment transitions are borrowed directly across handle and adjacency comparisons; this helper adds no memo or duplicate representation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar is returned. The caller keeps the transition record, and no retained population, handle, buffer, or task is acquired.
 */
export const productionFilmAssemblyTransitionDuration: (transition: IAutoMovieFilmTimeline["segments"][number]["transitionIn"]) => number = (
  transition: IAutoMovieFilmTimeline["segments"][number]["transitionIn"],
): number => ("durationFrames" in transition ? transition.durationFrames : 0);
