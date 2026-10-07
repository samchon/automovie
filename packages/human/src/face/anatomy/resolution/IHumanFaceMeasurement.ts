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
 * @evidence contracts/common.md#principled-implementation A measurement couples one final-surface reader with the channels that may answer it, so an inverse is judged on the real output.
 * @evidence contracts/common.md#clear-and-simple-design Four fields: identity, unit, solvable channels and reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reader without its registration returns a named gap, never a proxy.
 * @evidence contracts/common.md#meaningful-documentation States the reader's contract, the channel order and the report-only case.
 * @evidence contracts/modeling.md#parameter-channels Channels are existing named basis channels the inverse may move.
 * @evidence contracts/modeling.md#spatial-conventions Values are millimetres, square millimetres, degrees or cubic centimetres as the unit field states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A measurement names no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A measurement emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A measurement builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the readings.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each registered measurement states its own protocol beside its reader.
 * @evidenceExclude contracts/anatomy.md#permitted-range The channels' admitted ranges bound a solve.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The measurement is a reader, not a caller input.
 * @author Samchon
 */
export interface IHumanFaceMeasurement {
  /** Registered measurement name a document target uses. */
  id: string;

  /** Unit of the reading and of a target. */
  unit: "millimetres" | "square-millimetres" | "degrees" | "cubic-centimetres" | "count";

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
   *
   * @evidence contracts/common.md#principled-implementation The reader measures the final surface the build emits.
   * @evidence contracts/common.md#clear-and-simple-design One reader per measurement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing registration returns a named gap, never a proxy reading.
   * @evidence contracts/common.md#meaningful-documentation States what the reader returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The callback is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The callback emits no geometry.
   * @evidence contracts/modeling.md#spatial-conventions Returns the value in the measurement's unit.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The callback builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The callback owns nothing a viewer displays.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement or caller states the protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range The callback admits no value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback is a reader, not a caller input.
   */
  read: (context: IHumanFaceMeasurementContext) => number | IHumanFaceMeasurementGap;
}
