/**
 * The basis names a person document declares for its face and body.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both declared bases.
 *
 * @evidence contracts/common.md#principled-implementation Face and body fields retain the two basis identities declared by the composed Person document.
 * @evidence contracts/common.md#clear-and-simple-design The record projects the two basis names without copying either domain's full document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both names come from the document rather than guessed compatibility of similarly named basis files.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonBases {
  /** `face.basis` of the document. */
  face: string;

  /** `body.basis` of the document. */
  body: string;
}
