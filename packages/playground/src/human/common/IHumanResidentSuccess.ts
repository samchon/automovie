/**
 * A resident worker's successful numerical value for one request.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Correlates the returned candidate with its original edit.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Distinguishes successful values from numerical refusals in the reply protocol.
 * @author Samchon
 */
export interface IHumanResidentSuccess<Output> {
  /** Identity of the request that produced the value. */
  id: number;

  /** Successful reply discriminator. */
  success: true;

  /** Evaluated numerical value. */
  value: Output;
}
