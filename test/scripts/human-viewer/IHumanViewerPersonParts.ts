/**
 * The two parts of a person document whose basis names the catalogue reads;
 * either may be missing or malformed until checked.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the parts read and that they are unchecked.
 * @author Samchon
 */
export interface IHumanViewerPersonParts {
  /** The face document. */
  face?: unknown;

  /** The body document. */
  body?: unknown;
}
