/**
 * The product runtime input the resident page forwards to the numerical
 * worker: the document text and whether the face bakes ambient occlusion.
 *
 * @evidence contracts/common.md#principled-implementation Carries exactly the two fields the product runtimes read from a preview request.
 * @evidence contracts/common.md#meaningful-documentation States both fields.
 * @author Samchon
 */
export interface IHumanViewerNumericalInput {
  /** The document as serialized text, admitted by the runtime. */
  document: string;

  /** Whether the face producer bakes ambient occlusion. */
  occlusion?: boolean;
}
