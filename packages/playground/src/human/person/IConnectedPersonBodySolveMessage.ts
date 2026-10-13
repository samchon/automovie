/**
 * Solve a measured body channel for a target length on the body view.
 *
 * @author Samchon
 */
export interface IConnectedPersonBodySolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solveMeasurement";

  /** Body shape to solve from. */
  shape: Record<string, number>;

  /** Measured body channel. */
  channel: string;

  /** Target length, metres. */
  targetMetres: number;
}
