/**
 * Solve a measured body channel for a target length on the body view.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Requests the body channel weight that makes the body measure a target length.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Carries the shape, channel and target metres the measurement worker inverts.
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
