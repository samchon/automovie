import type { IAutoMovieHumanFaceBasisChannel } from "../../structures/IAutoMovieHumanFaceBasisChannel";
import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One face measurement target to solve onto the existing channels the
 * measurement lists.
 *
 * `read` measures the editor's current document with one channel's weight
 * replaced, on the same final surface the builder emits, so the inverse is
 * judged on the real output. `weights` holds the document's current weight of
 * each listed channel; an omitted channel is at zero.
 *
 * @evidence contracts/common.md#principled-implementation The solver needs the measurement, the target, the channels it may move with their current weights, and a forward reading of the real build.
 * @evidence contracts/common.md#clear-and-simple-design Five fields; the build stays with the caller through `read`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex or secondary channel enters; only listed channels move.
 * @evidence contracts/common.md#meaningful-documentation States what `read` measures and the omitted-weight convention.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidence contracts/modeling.md#parameter-channels Channels are the basis's existing named channels with their authored envelopes.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions The target is in the measurement's unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the solved reading.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement states its protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range The channels' envelopes bound the solve.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is the solver's input, not a document field.
 * @author Samchon
 */
export interface IHumanFaceMeasurementSolveInput {
  /** The registered measurement the target names. */
  measurement: IHumanFaceMeasurement;

  /** Requested value in the measurement's unit. */
  target: number;

  /** The basis channels, from which the measurement's listed channels are taken. */
  channels: readonly IAutoMovieHumanFaceBasisChannel[];

  /** The document's current weight of each listed channel; omitted is zero. */
  weights: Readonly<Record<string, number>>;

  /**
   * Measure the current document with one channel at one weight.
   *
   * @evidence contracts/common.md#principled-implementation The reading is the registered measurement on the real final surface.
   * @evidence contracts/common.md#clear-and-simple-design One reading per channel weight.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A gap is returned as such, never as a number.
   * @evidence contracts/common.md#meaningful-documentation States what the callback measures.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The callback is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The callback emits no geometry.
   * @evidence contracts/modeling.md#spatial-conventions Returns the measurement's unit.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The callback builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The callback owns nothing a viewer displays.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement states its protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range The callback admits no value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback is a reader, not a caller input.
   */
  read: (channel: string, weight: number) => number | IHumanFaceMeasurementGap;
}
