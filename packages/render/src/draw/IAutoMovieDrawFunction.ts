import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
} from "@automovie/interface";

/**
 * The draw-only function a page installs under `AUTO_MOVIE_DRAW_GLOBALS.draw`,
 * which every host calls to get pictures: describe the subject, hand the page
 * the film's dialogue mouths when it has a sound list, then draw one call at a
 * time.
 *
 * `installAutoMovieDraw` provides it; `AutoMovieDrawSession` calls it from Node
 * through the browser driver. Calls must not overlap, because they share one
 * scene and one renderer.
 */
export interface IAutoMovieDrawFunction {
  /** Create the injected subject if it is not yet, and describe it. */
  describe(): Promise<IAutoMovieDrawDescription>;

  /**
   * Take the film's dialogue mouths over `track`, replacing any taken before;
   * every later draw shows them on the speaking actors' bound figures and
   * reports the mouths those figures showed. An actor with no bound figure
   * under its scene node shows none.
   */
  speak(track: IAutoMovieDialogueMouthTrack): Promise<void>;

  /** Draw one picture. */
  draw(call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult>;
}
