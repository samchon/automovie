import type { IConnectedBodyFemoralHeadMeasurement } from "./IConnectedBodyFemoralHeadMeasurement";

/**
 * A preview's femoral head reading: every target head read against the
 * skin, or unavailable because the posed skin crosses itself.
 *
 * @author Samchon
 */
export interface IConnectedBodyFemoralHeads {
  /** Measured, or unavailable on a self-crossing skin. */
  status: "measured" | "skin-crossing";

  /** One reading per target head; empty when unavailable. */
  heads: IConnectedBodyFemoralHeadMeasurement[];
}
