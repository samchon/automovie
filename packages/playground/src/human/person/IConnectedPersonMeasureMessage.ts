/**
 * One request the person editor posts to its measurement worker.
 *
 * @author Samchon
 */
export interface IConnectedPersonMeasureMessage {
  /** Correlates the reply. */
  id: number;

  /** `solveMeasurement`, `readPersonMeasurement` or `solvePersonMeasurement`. */
  kind: string;

  /** Body shape to solve from (`solveMeasurement`). */
  shape: Record<string, number>;

  /** Serialized person document (person kinds). */
  document: string;

  /** Measured body channel, which also names a person measurement. */
  channel: string;

  /** Target length, metres (solve kinds). */
  targetMetres: number;
}
