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
   */
  read: (channel: string, weight: number) => number | IHumanFaceMeasurementGap;
}
