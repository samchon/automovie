import type { ConnectedBodyHumeralHeadReading } from "./ConnectedBodyHumeralHeadReading";

/**
 * A preview's measured anatomy: every humeral head read against the skin.
 *
 * @author Samchon
 */
export interface IConnectedBodyMeasuredAnatomy {
  /** The heads were measured. */
  status: "measured";

  /** One reading per humeral head. */
  heads: ConnectedBodyHumeralHeadReading[];
}
