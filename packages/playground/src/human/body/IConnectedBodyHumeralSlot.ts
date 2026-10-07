import type { renderBodyHumeralHeadControls } from "./bodyHumeralHeadControls";

/**
 * The slot the body panel's earlier closures read the humeral-head controls
 * through: empty until the controls mount, so a refusal or refresh before
 * then skips them instead of reading an uninitialized binding.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets earlier panel closures reach the humeral-head controls only after they mount.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Skips the controls on a refusal or refresh that arrives before they exist, keeping the last valid state.
 * @author Samchon
 */
export interface IConnectedBodyHumeralSlot {
  /** The mounted humeral-head controls, once mounted. */
  controls?: ReturnType<typeof renderBodyHumeralHeadControls>;
}
