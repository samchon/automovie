/**
 * The product runtime input the resident page forwards to the numerical
 * worker: the original document text, explicit construction or static encoding operation and
 * whether the face bakes ambient occlusion.
 *
 * @evidence contracts/common.md#principled-implementation Carries the product request operation without changing document admission or source input.
 * @evidence contracts/common.md#meaningful-documentation States each request field.
 *
 * @evidence contracts/common.md#clear-and-simple-design One serialized document and its explicit operation carry the existing runtime request without display metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preview, construct, exportConstruction and admit are supported product operations; absence preserves preview semantics.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Carries the product request operation without changing document admission or source input.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preview, construct, exportConstruction and admit are supported product operations; absence preserves preview semantics.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalInput {
  /**
   * The document as serialized text, admitted by the runtime.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Sends the original serialized document to its actual domain parser rather than accepting a viewer projection as schema-valid.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Sends the original serialized document to its actual domain parser rather than accepting a viewer projection as schema-valid.
   */
  document: string;

  /**
   * Explicit product operation; construction encoding is supported only for Person. Absent means admitted preview.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Keeps supported preview, construction, static encoding and document admission distinct, with omitted operation retaining preview.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Keeps supported preview, construction, static encoding and document admission distinct, with omitted operation retaining preview.
   */
  operation?: "preview" | "construct" | "exportConstruction" | "admit";

  /**
   * Whether the face producer bakes ambient occlusion.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Carries the explicit Face ambient-occlusion choice without modifying numerical shape inputs.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Carries the explicit Face ambient-occlusion choice without modifying numerical shape inputs.
   */
  occlusion?: boolean;
}
