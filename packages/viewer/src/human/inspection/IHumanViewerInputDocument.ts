/**
 * The members the input reader reads of a hand-written document before its owner admits it; both may be missing or malformed.
 *
 * @evidence contracts/common.md#principled-implementation Names only optional unexamined id/basis fields used to route hand-written JSON before domain-owner admission.
 * @evidence contracts/common.md#clear-and-simple-design Unknown fields keep ingress projection separate from the full numerical document schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/empty id and mismatched basis refuse in readHumanViewerInputs; a cast to this interface cannot admit malformed content.
 * @evidence contracts/common.md#meaningful-documentation Documents nonempty id requirement and declared face/body basis meaning while allowing malformed unknown values to reach explicit guards.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type performs no parsing; file read/JSON/hash and per-document field checks remain with the input owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Accepted numerical keys use full document/basis/source authority; projected id/basis fields alone cannot authorize equivalent models.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed document lifetime belongs to file memo/catalogue owners, with no native handle, additional validation driver or model cache created here.
 *
 * @author Samchon
 */
export interface IHumanViewerInputDocument {
  /** Document id, required to be a nonempty string. */
  id?: unknown;

  /** Declared basis id of a face or body document. */
  basis?: unknown;
}
