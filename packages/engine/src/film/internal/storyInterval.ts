import {
  IAutoMovieShotStoryTime,
  type IAutoMovieStoryInterval,
} from "@automovie/interface";

import { storyTime } from "./storyTime";

/*
 * Map a shot-local window onto the story-clock interval it occupies, in
 * seconds.
 *
 * The edit places a shot in the presentation; this places a stretch of the same
 * shot in the story, either the whole shot (`{ from: 0, to: duration }`) or an
 * event window inside it. Two windows may overlap here while their shots sit
 * far apart in the cut, which is a relationship a cut list cannot express.
 *
 * Both ends go through storyTime, so the interval keeps the
 * window's order exactly when the pin's rate is positive. Nothing is validated
 * here: a non-finite bound or pin yields a non-finite end, and an inverted
 * window yields an inverted interval, for the caller to refuse.
 */
export const storyInterval = (
  pin: IAutoMovieShotStoryTime,
  window: IAutoMovieStoryInterval.IWindow,
): IAutoMovieStoryInterval.IResult => ({
  from: storyTime(pin, window.from),
  to: storyTime(pin, window.to),
});
