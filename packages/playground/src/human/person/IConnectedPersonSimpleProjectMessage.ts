/**
 * Project simple values from the exact current person rather than a standard
 * head paired with its body.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Requests current-person simple readback without replacing its face.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Carries the canonical document whose body anatomy and head affect the inversion.
 */
export interface IConnectedPersonSimpleProjectMessage {
  /** Transport request identity. */
  id: number;

  /** Projection operation. */
  kind: "projectPersonSimple";

  /** Current whole-person document text. */
  document: string;
}
