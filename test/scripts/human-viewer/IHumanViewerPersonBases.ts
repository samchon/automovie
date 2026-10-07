/**
 * The basis names a person document declares for its face and body.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both declared bases.
 * @author Samchon
 */
export interface IHumanViewerPersonBases {
  /** `face.basis` of the document. */
  face: string;

  /** `body.basis` of the document. */
  body: string;
}
