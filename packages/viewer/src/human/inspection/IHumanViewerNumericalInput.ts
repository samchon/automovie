/**
 * The product runtime input the resident page forwards to the numerical
 * worker: the original document text, explicit construction or static encoding operation and
 * whether the face bakes ambient occlusion.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalInput {
  /** The document as serialized text, admitted by the runtime. */
  document: string;

  /**
   * Explicit product operation; construction encoding is supported only for Person. Absent means admitted preview.
   */
  operation?: "preview" | "construct" | "exportConstruction" | "admit";

  /** Whether the face producer bakes ambient occlusion. */
  occlusion?: boolean;
}
