/**
 * Read every head measurement on a person's skin at rest.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Requests the person's head measurements in metres.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Carries the person document whose head the worker reads.
 * @author Samchon
 */
export interface IConnectedPersonHeadReadMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "readPersonHead";

  /** Serialized person document. */
  document: string;
}
