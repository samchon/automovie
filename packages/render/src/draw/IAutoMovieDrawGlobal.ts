import type { IAutoMovieDrawFunction } from "./IAutoMovieDrawFunction.js";
import type { IAutoMovieDrawProps } from "./IAutoMovieDrawProps.js";

/**
 * The global object a draw page and its host share, under the names
 * `AUTO_MOVIE_DRAW_GLOBALS` holds: the host's init script puts the props on it
 * before the page loads, and `AutoMovieRenderDraw.installAutoMovieDraw` puts the draw function on
 * it and releases the page's resources when the page is hidden. The same two
 * names are declared on `globalThis`, so a page's own global object is one.
 */
export interface IAutoMovieDrawGlobal<Props = unknown> {
  /** The props the host injected; absent when the page is opened alone. */
  __automovieDrawProps?: IAutoMovieDrawProps<Props> | undefined;

  /** The installed draw function; absent until the page installs it. */
  __automovieDraw?: IAutoMovieDrawFunction | undefined;

  /** Registers the page-hide release; absent on a target without events. */
  addEventListener?: (
    type: "pagehide",
    listener: () => void,
    options: { once: true },
  ) => void;
}

declare global {
  /**
   * The props a draw page's host injected; see {@link IAutoMovieDrawGlobal}.
   * The host writes them as text before the page loads, so the page reads them
   * as the props type its own subjects take; the declaration admits every such
   * type.
   */
  var __automovieDrawProps: IAutoMovieDrawProps<never> | undefined;

  /** A draw page's installed draw function; see {@link IAutoMovieDrawGlobal}. */
  var __automovieDraw: IAutoMovieDrawFunction | undefined;
}
