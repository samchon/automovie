import type { IConnectedBodyFemoralHeadMeasurement } from "./IConnectedBodyFemoralHeadMeasurement";

/**
 * A preview's femoral head reading: every target head read against the
 * skin, or unavailable because the posed skin crosses itself.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Returns the femoral head readings shown beside the preview, or why they are unavailable.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the femoral head state the reading panel displays.
 * @author Samchon
 */
export interface IConnectedBodyFemoralHeads {
  /** Measured, or unavailable on a self-crossing skin. */
  status: "measured" | "skin-crossing";

  /** One reading per target head; empty when unavailable. */
  heads: IConnectedBodyFemoralHeadMeasurement[];
}
