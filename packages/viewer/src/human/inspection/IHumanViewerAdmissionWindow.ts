import type { IHumanViewerAdmissionBridge } from "./IHumanViewerAdmissionBridge.js";

/**
 * The window members admission travels through: each viewer frame's own admission, set when its module loads, and the host page's bridge to them.
 *
 * @evidence contracts/common.md#principled-implementation Names same-origin frame globals for loaded wire protocol, domain admission and the host's standing bridge.
 * @evidence contracts/common.md#clear-and-simple-design Keeps module-loaded admission available before geometry commit without mixing it with the completed viewer handle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional hooks mean absence is possible; the host checks newest-present protocol/hook availability before dispatch rather than asserting readiness by cast.
 * @evidence contracts/common.md#meaningful-documentation Defines frame versus host members and absent-state meaning; a loaded hook alone is not current-source or displayed-geometry proof.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Window typing erases; actual bridge selection and numerical admission own runtime work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each frame publishes its own hooks while the host rereads its current candidate/committed ordering; earlier hooks cannot authorize a newer frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Frame retirement owns globals and numerical transport disposal; this interface retains no iframe or parallel bridge instance.
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
   * @evidence contracts/common.md#principled-implementation Calls the frame's actual checked numerical admission with domain, document JSON and basis, returning null or its owner refusal.
   * @evidence contracts/common.md#clear-and-simple-design Publishes the existing numerical.admit operation when the frame module loads rather than constructing a second schema judge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent hooks remain unavailable to the host; a successful return is numerical admission and cannot certify rendered appearance.
   * @evidence contracts/common.md#meaningful-documentation Null is admitted and a string is the owner's refusal; the host wraps it with availability and the selected frame token.
   * @evidence contracts/performance.md#efficient-algorithms Judgment cost follows domain document/basis work; global publication itself adds no traversal or geometry copy.
   * @evidence contracts/performance.md#reuse-equivalent-work The current frame shares its numerical transport; cached server verdicts still require document/key and current-frame source authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The frame owns transport lifetime; each returned judgment task settles through that transport and the window member acquires no separate worker.
   */
  __humanViewerAdmit?: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<string | null>;

  /** The host page's bridge, set when the host module runs. */
  __humanViewerAdmission?: IHumanViewerAdmissionBridge;
}
