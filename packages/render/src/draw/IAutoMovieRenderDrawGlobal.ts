import "./internal/declareDrawGlobals";

import type { IAutoMovieRenderDrawFunction } from "./IAutoMovieRenderDrawFunction";
import type { IAutoMovieRenderDrawProps } from "./IAutoMovieRenderDrawProps";

/**
 * The global object a draw page and its host share, under the names
 * `AutoMovieRenderDrawGlobals` holds: the host's init script puts the props on it
 * before the page loads, and `AutoMovieRenderDraw.installAutoMovieDraw` puts the draw function on
 * it and releases the page's resources when the page is hidden. The same two
 * names are declared on `globalThis`, so a page's own global object is one.
 */
export interface IAutoMovieRenderDrawGlobal<Props = unknown> {
  /** The props the host injected; absent when the page is opened alone. */
  __automovieDrawProps?: IAutoMovieRenderDrawProps<Props> | undefined;

  /** The installed draw function; absent until the page installs it. */
  __automovieDraw?: IAutoMovieRenderDrawFunction | undefined;

  /** Registers the page-hide release; absent on a target without events. */
  addEventListener?: (
    type: "pagehide",
    listener: () => void,
    options: { once: true },
  ) => void;
}
