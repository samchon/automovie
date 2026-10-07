import type { ConnectedBodyHumeralHeadReading } from "./ConnectedBodyHumeralHeadReading";

/**
 * A preview's measured anatomy: every humeral head read against the skin.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Returns the humeral head readings shown beside the preview.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the measured anatomy state the reading panel displays.
 * @author Samchon
 */
export interface IConnectedBodyMeasuredAnatomy {
  /** The heads were measured. */
  status: "measured";

  /** One reading per humeral head. */
  heads: ConnectedBodyHumeralHeadReading[];
}
