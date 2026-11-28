import type { IAutoMovieRenderDrawFunction } from "../IAutoMovieRenderDrawFunction";
import type { IAutoMovieRenderDrawGlobal } from "../IAutoMovieRenderDrawGlobal";
import type { IAutoMovieRenderDrawProps } from "../IAutoMovieRenderDrawProps";

declare global {
  /**
   * The props a draw page's host injected; see {@link IAutoMovieRenderDrawGlobal}.
   * The host writes them as text before the page loads, so the page reads them
   * as the props type its own subjects take; the declaration admits every such
   * type.
   */
  var __automovieDrawProps: IAutoMovieRenderDrawProps<never> | undefined;

  /** A draw page's installed draw function; see {@link IAutoMovieRenderDrawGlobal}. */
  var __automovieDraw: IAutoMovieRenderDrawFunction | undefined;
}
