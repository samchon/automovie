/**
 * The members the input reader reads of a hand-written document before its
 * owner admits it; both may be missing or malformed.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the members read and that they are unchecked.
 *
 * @evidence contracts/common.md#principled-implementation Unknown optional id and basis fields preserve malformed external JSON until the input reader validates their meaning.
 * @evidence contracts/common.md#clear-and-simple-design Only the catalogue's two preliminary identity fields are projected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A TypeScript declaration does not turn missing or malformed external identity values into trusted strings.
 *
 * @author Samchon
 */
export interface IHumanViewerInputDocument {
  /** Document id, required to be a nonempty string. */
  id?: unknown;

  /** Declared basis id of a face or body document. */
  basis?: unknown;
}
