/**
 * Read a person measurement on a person's final skin at rest.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Requests a person measurement read on the final skin at rest.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Carries the person document and measurement the worker reads.
 * @author Samchon
 */
export interface IConnectedPersonReadMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "readPersonMeasurement";

  /** Serialized person document. */
  document: string;

  /** Body channel that names the person measurement. */
  channel: string;
}
