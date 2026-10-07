/**
 * Solve one measured detailed channel for a target length in metres.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the channel weight that makes the current body measure the millimetre target the user entered.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the channel and target metres the separate worker inverts with bounded secant and bisection steps.
 * @author Samchon
 */
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
