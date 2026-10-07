/**
 * The product runtime input the resident page forwards to the numerical
 * worker: the original document text, explicit construction operation and
 * whether the face bakes ambient occlusion.
 *
 * @evidence contracts/common.md#principled-implementation Carries the product request operation without changing document admission or source input.
 * @evidence contracts/common.md#meaningful-documentation States each request field.
 * @author Samchon
 */
export interface IHumanViewerNumericalInput {
  /** The document as serialized text, admitted by the runtime. */
  document: string;

  /** Explicit owner construction request; absent means ordinary admitted preview. */
  operation?: "preview" | "construct" | "admit";

  /** Whether the face producer bakes ambient occlusion. */
  occlusion?: boolean;
}
