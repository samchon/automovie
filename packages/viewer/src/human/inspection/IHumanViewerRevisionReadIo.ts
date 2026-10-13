/**
 * Borrowed text reader used with the revision resolver to hash loaded source.
 *
 * @evidence contracts/common.md#principled-implementation Revision hashing reads current source text and keeps an unavailable file distinct through an undefined result.
 * @evidence contracts/common.md#clear-and-simple-design One borrowed text reader leaves import resolution and digest construction with the revision owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The port supplies original source text rather than rewriting modules or inventing bytes for unavailable files.
 * @evidence contracts/common.md#meaningful-documentation Documents the current-text result and the undefined unreadable-file state.
 * @author Samchon
 */
export interface IHumanViewerRevisionReadIo {
  /**
   * Return current source text, or undefined when this file cannot be read.
   *
   * @evidence contracts/common.md#principled-implementation Source text is returned unchanged and an unreadable file is represented by undefined.
   * @evidence contracts/common.md#clear-and-simple-design The revision owner borrows reading while retaining hashing and graph traversal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable source bytes are not replaced with a fabricated empty module.
   * @evidence contracts/common.md#meaningful-documentation Defines current text and the undefined failure result.
   */
  read(file: string): string | undefined;
}
