/**
 * The members the input reader reads of a hand-written document before its
 * owner admits it; both may be missing or malformed.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the members read and that they are unchecked.
 * @author Samchon
 */
export interface IHumanViewerInputDocument {
  /** Document id, required to be a nonempty string. */
  id?: unknown;

  /** Declared basis id of a face or body document. */
  basis?: unknown;
}
