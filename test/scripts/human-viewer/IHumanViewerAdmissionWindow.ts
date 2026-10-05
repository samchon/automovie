import type { IHumanViewerAdmissionBridge } from "./IHumanViewerAdmissionBridge";

/**
 * The window members admission travels through: each viewer frame's own
 * admission, set when its module loads, and the host page's bridge to them.
 *
 * @evidence contracts/common.md#meaningful-documentation Names which window carries each member and when it is set.
 * @author Samchon
 */
export interface IHumanViewerAdmissionWindow {
  /** A viewer frame's admission; null when admitted, else the owner's reason. Set when the frame module loads. */
  __humanViewerAdmit?: (domain: string, text: string) => string | null;

  /** The host page's bridge, set when the host module runs. */
  __humanViewerAdmission?: IHumanViewerAdmissionBridge;
}
