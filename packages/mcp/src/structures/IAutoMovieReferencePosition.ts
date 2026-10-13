


/**
 * A position in the decoded source, retaining UTF-16 offsets and one-based coordinates.
 *
 * @evidence contracts/common.md#principled-implementation UTF-16 offsets and one-based source coordinates represent the decoded original text, including CRLF as one line break.
 * @evidence contracts/common.md#clear-and-simple-design One position value supports both range endpoints and diagnostic coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates refer to original source rather than a regenerated comment-free edition.
 * @evidence contracts/common.md#meaningful-documentation Members state offset and coordinate bases; the type owns no validation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferencePosition {

  /** Zero-based UTF-16 code-unit offset into the decoded original source. */
  offset: number;

  /** One-based source line, treating CRLF as one line break. */
  line: number;

  /** One-based UTF-16 column within the original source line. */
  column: number;
}
