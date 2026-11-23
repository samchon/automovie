/**
 * Immutable UTF-8 JSON-array fragment streamed into a larger artifact. The
 * producer owns JSON validity and the exact item population. The artifact
 * writer checks a nonnegative safe count, SHA-256, outer brackets and the exact
 * empty representation `[]`; it streams nonempty interiors without parsing or
 * recounting them. Paths use the publishing host's namespace.
 */

export interface IAutoMovieJsonArraySource {
  /** Path of a generating plain JSON array fragment. */
  path: string;

  /** SHA-256 of its complete immutable bytes. */
  sha256: string;

  /** Producer-reported array item population. */
  items: number;
}
