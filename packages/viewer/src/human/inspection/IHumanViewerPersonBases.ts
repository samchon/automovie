/**
 * The basis names a person document declares for its face and body.
 *
 * @evidence contracts/common.md#principled-implementation Projects required nonempty face.basis and body.basis names from an unexamined person document.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the two independent declared basis authorities separate from packet/generation file digests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or malformed basis references refuse rather than receiving defaults; full Person schema and anatomy remain downstream judgments.
 * @evidence contracts/common.md#meaningful-documentation Documents the two nested basis names without claiming their presence admits the entire document.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The value performs no projection; readHumanViewerPersonBases does two object/member/string checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Names are checked for each input; actual paired byte/source key authority is required for numerical reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two borrowed strings escape projection and no model, basis buffer or worker handle is retained.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonBases {
  /** `face.basis` of the document. */
  face: string;

  /** `body.basis` of the document. */
  body: string;
}
