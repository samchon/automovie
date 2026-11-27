import type { AutoMovieDisplayCompositor } from "./AutoMovieDisplayCompositor.js";

/** The caller-owned compositors a beauty frame mixes in. */
export interface IRenderAutoMovieFilmFrameCompositors {
  /** The compositor of a fade toward black or transparency. */
  fade: AutoMovieDisplayCompositor;

  /** The compositor of a dissolve between two layers. */
  dissolve: AutoMovieDisplayCompositor;
}
