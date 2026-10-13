import { IAutoMovieShotStoryTime } from "@automovie/interface";

import { autoMovieStoryTime } from "./autoMovieStoryTime";

/**
 * Story-clock interval a whole pinned shot occupies, in seconds.
 *
 * The edit places a shot in the presentation; this places the same shot in the
 * story. Two shots may overlap here while sitting far apart in the cut, which
 * is exactly the fact a cut list cannot express.
 */
export const autoMovieStoryInterval = (
  pin: IAutoMovieShotStoryTime,
  durationSeconds: number,
): { from: number; to: number } => ({
  from: autoMovieStoryTime(pin, 0),
  to: autoMovieStoryTime(pin, durationSeconds),
});
