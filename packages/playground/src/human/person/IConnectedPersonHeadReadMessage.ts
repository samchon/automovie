/**
 * Read every head measurement on a person's skin at rest.
 *
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
