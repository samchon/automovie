/**
 * Solve one face measurement target onto the channels the measurement lists.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solveFaceMeasurement";

  /** Serialized person document. */
  document: string;

  /** Registered face measurement name. */
  measurement: string;

  /** Requested value in the measurement's unit. */
  target: number;
}
