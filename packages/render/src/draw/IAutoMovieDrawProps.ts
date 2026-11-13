/**
 * What a host injects into a draw page before it loads, under `AUTO_MOVIE_DRAW_GLOBALS.props`: which subject to create and the data its module reads.
 *
 * It arrives through an init script, so the page's modules see it before their first line runs and the page needs no address parameter or interface to be told what to draw.
 *
 * @evidence contracts/development/design.md#principled-representation The subject's name, or null for the page's only subject, and the module's own data as JSON.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Written by `AutoMovieDrawSession.open`, read by `installAutoMovieDraw`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `props` is `unknown` because its shape belongs to the subject module; an absent value is null rather than an empty object with a guessed shape.
 * @evidence contracts/development/common.md#meaningful-documentation States who writes and reads it, how it arrives, and what null means for each member.
 */
export interface IAutoMovieDrawProps {
  /** Name of the subject to create, or null for the page's only subject. */
  subject: string | null;

  /** Data the subject module reads, as JSON, or null when it reads none. */
  props: unknown;
}
