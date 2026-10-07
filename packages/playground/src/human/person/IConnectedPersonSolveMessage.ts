/**
 * Solve a person measurement along its body channel for a target.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Requests a person measurement solved along its body channel for a target.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Carries the person document, measurement and target the worker inverts.
 * @author Samchon
 */
export interface IConnectedPersonSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solvePersonMeasurement";

  /** Serialized person document. */
  document: string;

  /** Body channel that names the person measurement. */
  channel: string;

  /** Target value, metres. */
  targetMetres: number;
}
