import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One registered face measurement: what it reads on the final surface and
 * which existing channels a target for it may move.
 *
 * `read` measures one build and returns the value in `unit`, or a named gap
 * when the basis lacks what the measurement needs. `channels` lists the
 * existing channels the editor's inverse may move for a target, tried in
 * order within each channel's admitted range; an empty list makes the
 * measurement report-only. Its report can retain requested context, but the
 * editor inverse refuses a target with no solving channel rather than treating
 * it as achieved without moving shape. Each face part owner registers its measurements in its own
 * file and adds them to `HUMAN_FACE_MEASUREMENTS`.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurement {
  /** Registered measurement name a document target uses. */
  id: string;

  /** Unit of the reading and of a target. */
  unit:
    | "millimetres"
    | "square-millimetres"
    | "degrees"
    | "cubic-centimetres"
    | "count";

  /** Existing channels a target may move, in solve order; empty is report-only. */
  channels: readonly string[];

  /**
   * Qualification of the observable source quantity when it differs from a
   * clinically registered measurement. Kept with every numerical readout;
   * it grants neither a clinical value nor permission to invert this quantity.
   */
  qualification?: string;

  /**
   * Read one build's final surface, or name what the basis lacks.
   */
  read: (
    context: IHumanFaceMeasurementContext,
  ) => number | IHumanFaceMeasurementGap;
}
