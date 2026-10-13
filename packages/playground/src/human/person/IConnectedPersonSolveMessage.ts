/**
 * Solve a person measurement along its body channel for a target.
 *
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
