import { IAutoMovieFilmTimeline } from "@automovie/interface";

/**
 * The builder-owned film clock every film-effect projection reads.
 *
 * Segments map realized film frames back to shot-local source frames, and the
 * exact rational rate turns a shot-local second into the frame the engine
 * sampler will actually compare against.
 *
 * @author Samchon
 */
export type IAutoMovieFilmEffectClock = Pick<
  IAutoMovieFilmTimeline,
  "fps" | "frameRate" | "segments"
>;
