/**
 * The physical unit a fine face control displays instead of its weight:
 * degrees for jaw opening and gaze, millimetres for jaw excursion.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Names the physical unit a fine face control shows instead of its weight.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Displays jaw opening and gaze in degrees and jaw excursion in millimetres.
 * @author Samchon
 */
export interface IConnectedFaceControlMetric {
  /** Units per channel weight. */
  perWeight: number;

  /** The unit suffix written after a value. */
  unit: string;

  /** The unit written in the control label. */
  label: string;
}
