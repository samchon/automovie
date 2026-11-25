/**
 * What a host injects into a draw page before it loads, under
 * `AUTO_MOVIE_DRAW_GLOBALS.props`: which subject to create and the data its
 * module reads.
 *
 * It arrives through an init script, so the page's modules see it before their
 * first line runs and the page needs no address parameter or interface to be
 * told what to draw. `Props` is the type of the data the page's subject module
 * declares it reads.
 */
export interface IAutoMovieDrawProps<Props = unknown> {
  /** Name of the subject to create, or null for the page's only subject. */
  subject: string | null;

  /** Data the subject module reads, as JSON, or null when it reads none. */
  props: Props;
}
