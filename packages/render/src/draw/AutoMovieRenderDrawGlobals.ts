/**
 * The two names a draw page and its host share on the page's global object:
 * `props`, where the host's init script puts the `IAutoMovieRenderDrawProps` before
 * the page loads, and `draw`, where `AutoMovieRenderDraw.installAutoMovieDraw` puts the
 * `IAutoMovieRenderDrawFunction` the host calls.
 *
 * Both start with `__automovie` so they cannot collide with a page's own
 * globals.
 */
export const AutoMovieRenderDrawGlobals: {
  /** Global holding the injected props. */
  readonly props: "__automovieDrawProps";

  /** Global holding the draw function. */
  readonly draw: "__automovieDraw";
} = {
  props: "__automovieDrawProps",
  draw: "__automovieDraw",
};
