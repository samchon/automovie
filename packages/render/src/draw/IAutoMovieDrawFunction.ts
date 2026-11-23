import type {
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
} from "@automovie/interface";

/**
 * The draw-only function a page installs under `AUTO_MOVIE_DRAW_GLOBALS.draw`, which every host calls to get pictures: describe the subject, then draw one call at a time.
 *
 * `installAutoMovieDraw` provides it; `AutoMovieDrawSession` calls it from Node through the browser driver. Calls must not overlap, because they share one scene and one renderer.
 */
export interface IAutoMovieDrawFunction {
  /**
   * Create the injected subject if it is not yet, and describe it.
   */
  describe(): Promise<IAutoMovieDrawDescription>;

  /**
   * Draw one picture.
   */
  draw(call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult>;
}
