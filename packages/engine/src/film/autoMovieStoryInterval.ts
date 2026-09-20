import { IAutoMovieShotStoryTime } from "@automovie/interface";
import { autoMovieStoryTime } from "./autoMovieStoryTime";

/**
 * Story-clock interval a whole pinned shot occupies, in seconds.
 *
 * The edit places a shot in the presentation; this places the same shot in the
 * story. Two shots may overlap here while sitting far apart in the cut, which
 * is exactly the fact a cut list cannot express.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-absolute-relative-time autoMovieStoryInterval maps both shot boundaries through the pin, exposing the absolute story interval the shot occupies.
 * @evidence requirements/story/story-clock-and-state.md#story-presentation-chronology Derives a shot's story interval from its pin rather than from adjacency or placement in the final presentation.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-representation autoMovieStoryInterval maps both local endpoints through the same pin so story overlap remains distinct from editorial adjacency.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-chronology-presentation Preserves an affine chronology interval that may overlap or diverge from the edit's presentation order.
 */
export const autoMovieStoryInterval = (
  pin: IAutoMovieShotStoryTime,
  durationSeconds: number,
): { from: number; to: number } => ({
  from: autoMovieStoryTime(pin, 0),
  to: autoMovieStoryTime(pin, durationSeconds),
});
