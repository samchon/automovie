import type { IAutoMovieFilmTimeline } from "../production/IAutoMovieFilmTimeline";

/**
 * The builder-owned film clock every film-effect projection reads.
 *
 * Segments map realized film frames back to shot-local source frames, and the
 * exact rational rate turns a shot-local second into the frame the engine
 * sampler will actually compare against. `fps` must equal `frameRate.numerator
 * / frameRate.denominator` when `frameRate` is present, and an integer `fps`
 * alone stands for `fps/1`; any other pair is refused as invalid film-effect
 * input.
 */
export type IAutoMovieFilmEffectClock = Pick<
  IAutoMovieFilmTimeline,
  "fps" | "frameRate" | "segments"
>;
