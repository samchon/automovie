import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
} from "@automovie/interface";

/**
 * The draw-only function a page installs under `AUTO_MOVIE_DRAW_GLOBALS.draw`,
 * which every host calls to get pictures: describe the subject, hand it the
 * film's dialogue mouths when it has a sound list, then draw one call at a
 * time.
 *
 * `AutoMovieRenderDraw.installAutoMovieDraw` provides it; `AutoMovieDrawSession` calls it from Node
 * through the browser driver. Calls must not overlap, because they share one
 * scene and one renderer.
 */
export interface IAutoMovieDrawFunction {
  /** Create the injected subject if it is not yet, and describe it. */
  describe(): Promise<IAutoMovieDrawDescription>;

  /**
   * Hand the subject the film's dialogue mouths over `track`, replacing any
   * handed before; every later draw reports the mouths the subject read. A
   * subject without `speak` takes none, and its draws report none.
   */
  speak(track: IAutoMovieDialogueMouthTrack): Promise<void>;

  /** Draw one picture. */
  draw(call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult>;
}
