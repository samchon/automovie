/**
 * The physical unit a fine face control displays instead of its weight:
 * degrees for jaw opening and gaze, millimetres for jaw excursion.
 *
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
