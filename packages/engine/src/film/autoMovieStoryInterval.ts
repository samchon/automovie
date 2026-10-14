import { IAutoMovieShotStoryTime } from "@automovie/interface";

import { autoMovieStoryTime } from "./autoMovieStoryTime";

/**
 * Map a shot-local window onto the story-clock interval it occupies, in seconds.
 *
 * The edit places a shot in the presentation; this places a stretch of the same
 * shot in the story, either the whole shot (`{ from: 0, to: duration }`) or an
 * event window inside it. Two windows may overlap here while their shots sit far
 * apart in the cut, which is a relationship a cut list cannot express.
 *
 * Both ends go through {@link autoMovieStoryTime}, so the interval keeps the
 * window's order exactly when the pin's rate is positive. Nothing is validated here: a
 * non-finite bound or pin yields a non-finite end, and an inverted window yields
 * an inverted interval, for the caller to refuse.
 *
 * @evidence contracts/common.md#principled-implementation The story map `originSeconds + t * rate` is affine, so the image of a window is the interval between the images of its two ends, computed by the same `autoMovieStoryTime` every other story-clock reader uses; order preservation requires a positive rate and finite mapped bounds.
 * @evidence contracts/common.md#clear-and-simple-design One mapping accepts an event contract's `{ from, to }` window directly instead of making callers map each bound by hand; callers own admission and diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds are neither clamped to the shot nor reordered, and no default rate other than the interface's documented `1` is applied, so a malformed window reaches the caller's own finiteness and order checks unchanged.
 * @evidence contracts/common.md#meaningful-documentation States what the interval means against the edit, the two window kinds it maps, why order is kept and under what precondition, and that invalid input passes through as non-finite or inverted output rather than throwing.
 * @evidence contracts/performance.md#efficient-algorithms Two affine evaluations and one two-field object per call, independent of shot length or event count; the caller's loop over a criterion's events is linear in those events.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure map evaluated once per addressed event; there is no completed work across calls to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned pair, which the caller owns, and retains neither the pin nor the window.
 */
export const autoMovieStoryInterval = (
  pin: IAutoMovieShotStoryTime,
  window: { readonly from: number; readonly to: number },
): { from: number; to: number } => ({
  from: autoMovieStoryTime(pin, window.from),
  to: autoMovieStoryTime(pin, window.to),
});
