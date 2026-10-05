/** Solve one measured detailed channel for a target length in metres. */
export interface IBodySimpleSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "solveMeasurement";

  /** The detailed shape the solve starts from. */
  shape: Record<string, number>;

  /** The measured channel to solve. */
  channel: string;

  /** The requested measurement, in metres. */
  targetMetres: number;
}
