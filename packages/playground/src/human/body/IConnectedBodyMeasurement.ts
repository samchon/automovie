/**
 * A measured body channel solved for a target: the new shape and the length
 * the solved body actually measures, in metres.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Returns the shape and the length the solved body actually measures for the entered millimetre target.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the inversion's result in metres for the measured row to display.
 * @author Samchon
 */
export interface IConnectedBodyMeasurement {
  /** The body shape after the solve. */
  shape: Record<string, number>;

  /** The measured length of the solved body, metres. */
  actualMetres: number;
}
