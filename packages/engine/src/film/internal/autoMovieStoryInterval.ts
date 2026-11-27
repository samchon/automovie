import {
  IAutoMovieShotStoryTime,
  type IAutoMovieStoryInterval,
} from "@automovie/interface";

import { autoMovieStoryTime } from "./autoMovieStoryTime";

/*
 * Map a shot-local window onto the story-clock interval it occupies, in
 * seconds.
 *
 * The edit places a shot in the presentation; this places a stretch of the same
 * shot in the story, either the whole shot (`{ from: 0, to: duration }`) or an
 * event window inside it. Two windows may overlap here while their shots sit
 * far apart in the cut, which is a relationship a cut list cannot express.
 *
 * Both ends go through autoMovieStoryTime, so the interval keeps the
 * window's order exactly when the pin's rate is positive. Nothing is validated
 * here: a non-finite bound or pin yields a non-finite end, and an inverted
 * window yields an inverted interval, for the caller to refuse.
 */
export const autoMovieStoryInterval = (
  pin: IAutoMovieShotStoryTime,
  window: IAutoMovieStoryInterval.IWindow,
): IAutoMovieStoryInterval.IResult => ({
  from: autoMovieStoryTime(pin, window.from),
  to: autoMovieStoryTime(pin, window.to),
});
