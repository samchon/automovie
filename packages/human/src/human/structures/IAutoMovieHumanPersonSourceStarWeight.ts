/**
 * One weighted source star a sample's normal reads: an original source vertex
 * on one normal domain, keyed `<vertex>:<domain>`, and its preimage weight.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceStarWeight {
  /** The star key, `<original vertex>:<normal domain>`. */
  key: string;

  /** The sample's preimage weight on that vertex. */
  weight: number;
}
