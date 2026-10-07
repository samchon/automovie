/**
 * Read every registered face measurement on a person's face.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceReadMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "readFaceMeasurements";

  /** Serialized person document. */
  document: string;
}
