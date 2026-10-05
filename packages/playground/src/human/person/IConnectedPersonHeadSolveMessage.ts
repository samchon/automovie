/**
 * Solve a person's head channels for head measurement targets.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Requests a head solved for measured targets.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Carries the person document and the targets in metres, by measurement name.
 * @author Samchon
 */
export interface IConnectedPersonHeadSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solvePersonHead";

  /** Serialized person document. */
  document: string;

  /** Target in metres per head measurement name (`HUMAN_PERSON_HEAD_SOLVE`). */
  targets: Record<string, number>;
}
