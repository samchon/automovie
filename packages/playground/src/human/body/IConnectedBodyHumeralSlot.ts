import type { renderBodyHumeralHeadControls } from "./bodyHumeralHeadControls";

/**
 * The slot the body panel's earlier closures read the humeral-head controls
 * through: empty until the controls mount, so a refusal or refresh before
 * then skips them instead of reading an uninitialized binding.
 *
 * @author Samchon
 */
export interface IConnectedBodyHumeralSlot {
  /** The mounted humeral-head controls, once mounted. */
  controls?: ReturnType<typeof renderBodyHumeralHeadControls>;
}
