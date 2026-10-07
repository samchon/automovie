/** A named admission refusal on an actually constructed geometry result.
 *
 * @evidence contracts/common.md#principled-implementation Carries an original refusal and its actual responsibility without converting failure into success.
 * @evidence contracts/common.md#clear-and-simple-design Two named strings preserve owner and cause separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record adds no geometry, fallback or substituted condition.
 * @evidence contracts/common.md#meaningful-documentation Field comments identify the responsibility and original reported cause.
 */
export interface IAutoMovieHumanConstructionFailure {
  /** Existing admission owner whose condition refused. */
  owner: string;

  /** Original reported cause, without changing the caller or geometry. */
  cause: string;
}
