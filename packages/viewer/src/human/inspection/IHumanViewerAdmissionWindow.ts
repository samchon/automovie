import type { IHumanViewerAdmissionBridge } from "./IHumanViewerAdmissionBridge.js";

/**
 * The window members admission travels through: each viewer frame's own
 * admission, set when its module loads, and the host page's bridge to them.
 *
 * @evidence contracts/common.md#meaningful-documentation Names which window carries each member and when it is set.
 *
 * @evidence contracts/common.md#principled-implementation Optional window members model actual frame loading separately from the standing host bridge.
 * @evidence contracts/common.md#clear-and-simple-design The frame protocol, frame admission callback and host bridge share one narrow browser-window projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent frame callback represents unavailable admission and supplies no fallback domain verdict.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionWindow {
  /**
   * Frame's loaded wire generation, independent of its geometry source digest.
   */
  __humanViewerProtocol?: string;

  /**
   * A viewer frame's admission; null when admitted, else the owner's reason. Set when the frame module loads.
   *
   * @evidence contracts/common.md#principled-implementation The loaded frame judges serialized document input against its selected domain and basis.
   * @evidence contracts/common.md#clear-and-simple-design The optional callback exposes frame admission independently of drawable geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing callback is replaced with an automatically accepted document.
   * @evidence contracts/common.md#meaningful-documentation Null means admitted; a string is the owner's refusal; omission means frame admission is not loaded.
   */
  __humanViewerAdmit?: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<string | null>;

  /** The host page's bridge, set when the host module runs. */
  __humanViewerAdmission?: IHumanViewerAdmissionBridge;
}
