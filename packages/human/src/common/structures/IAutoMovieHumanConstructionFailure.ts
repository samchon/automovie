/** A named admission refusal on an actually constructed geometry result.
 */
export interface IAutoMovieHumanConstructionFailure {
  /** Existing admission owner whose condition refused. */
  owner: string;

  /** Original reported cause, without changing the caller or geometry. */
  cause: string;
}
