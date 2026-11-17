/**
 * Immutable UTF-8 JSON-array fragment streamed into a larger artifact.
 * The producer owns JSON validity and the exact item population. The artifact
 * writer checks a nonnegative safe count, SHA-256, outer brackets and the exact
 * empty representation `[]`; it streams nonempty interiors without parsing or
 * recounting them. Paths use the publishing host's namespace.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates producer-owned JSON/count validity from the writer's hash, bracket and empty-array checks.
 * @evidence contracts/development/design.md#principled-representation The item count measures array entries, not bytes or generated vertices; SHA-256 covers the complete fragment.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Array publication and mesh-spool channels share this fragment descriptor without retaining file handles or decoded arrays.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A verified digest does not independently prove valid JSON, matching nonempty item count or admitted geometry.
 */

export interface IAutoMovieJsonArraySource {
 
 /** Path of a generating plain JSON array fragment. */
  path: string;

 
 /** SHA-256 of its complete immutable bytes. */
  sha256: string;

 
 /** Producer-reported array item population. */
  items: number;
}
