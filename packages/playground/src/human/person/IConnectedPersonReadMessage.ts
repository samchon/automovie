/**
 * Read a person measurement on a person's final skin at rest.
 *
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
